// eslint-disable-next-line no-restricted-imports
import { createClient } from '@supabase/supabase-js';

export interface HealthMetrics {
  totalPages: number;
  totalEmbeddings: number;
  missingEmbeddings: number;
  staleEmbeddings: number;
  errorEmbeddings: number;
  coverage: number;
  averageAge: number;
  oldestEmbedding: Date | null;
  newestEmbedding: Date | null;
  issues: string[];
}

export interface DomainHealth {
  domain: string;
  domain_id: string;
  metrics: HealthMetrics;
}

export class EmbeddingsHealthMonitor {
  private supabase: any;
  private staleThresholdDays = 90;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async checkHealth(domain?: string): Promise<HealthMetrics | DomainHealth[]> {
    try {
      if (domain) {
        return await this.checkDomainHealth(domain);
      } else {
        return await this.checkAllDomainsHealth();
      }
    } catch (error) {
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async checkDomainHealth(domain: string): Promise<HealthMetrics> {
    const { data: domainData, error: domainError } = await this.supabase
      .from('domains')
      .select('id')
      .eq('domain', domain)
      .single();

    if (domainError || !domainData) {
      throw new Error(`Domain "${domain}" not found`);
    }

    const domainId = domainData.id;

    const { count: totalPages } = await this.supabase
      .from('scraped_pages')
      .select('id', { count: 'exact', head: true })
      .eq('domain_id', domainId);

    const { count: totalEmbeddings } = await this.supabase
      .from('page_embeddings')
      .select('id', { count: 'exact', head: true })
      .eq('domain_id', domainId);

    const { data: pagesWithoutEmbeddings } = await this.supabase
      .from('scraped_pages')
      .select('id')
      .eq('domain_id', domainId)
      .is('embedding_id', null);

    const missingEmbeddings = pagesWithoutEmbeddings?.length || 0;

    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - this.staleThresholdDays);

    const { data: staleEmbeddingsData } = await this.supabase
      .from('page_embeddings')
      .select('id, created_at')
      .eq('domain_id', domainId)
      .lt('created_at', staleDate.toISOString());

    const staleEmbeddings = staleEmbeddingsData?.length || 0;

    const { data: embeddingAges } = await this.supabase
      .from('page_embeddings')
      .select('created_at')
      .eq('domain_id', domainId)
      .order('created_at', { ascending: true });

    let oldestEmbedding: Date | null = null;
    let newestEmbedding: Date | null = null;
    let averageAge = 0;

    if (embeddingAges && embeddingAges.length > 0) {
      oldestEmbedding = new Date(embeddingAges[0].created_at);
      newestEmbedding = new Date(embeddingAges[embeddingAges.length - 1].created_at);

      const now = Date.now();
      const totalAgeMs = embeddingAges.reduce((sum: number, e: any) => {
        return sum + (now - new Date(e.created_at).getTime());
      }, 0);
      averageAge = totalAgeMs / embeddingAges.length / (1000 * 60 * 60 * 24);
    }

    const coverage = totalPages && totalPages > 0
      ? ((totalPages - missingEmbeddings) / totalPages) * 100
      : 0;

    const issues: string[] = [];
    if (coverage < 90) {
      issues.push(`Low coverage: ${coverage.toFixed(1)}% (target: 90%+)`);
    }
    if (staleEmbeddings > 0) {
      issues.push(`${staleEmbeddings} stale embeddings (>${this.staleThresholdDays} days old)`);
    }
    if (missingEmbeddings > 0) {
      issues.push(`${missingEmbeddings} pages missing embeddings`);
    }

    return {
      totalPages: totalPages || 0,
      totalEmbeddings: totalEmbeddings || 0,
      missingEmbeddings,
      staleEmbeddings,
      errorEmbeddings: 0,
      coverage,
      averageAge,
      oldestEmbedding,
      newestEmbedding,
      issues
    };
  }

  private async checkAllDomainsHealth(): Promise<DomainHealth[]> {
    const { data: domains, error } = await this.supabase
      .from('domains')
      .select('id, domain');

    if (error) {
      throw new Error(`Failed to fetch domains: ${error.message}`);
    }

    if (!domains || domains.length === 0) {
      return [];
    }

    const healthChecks: DomainHealth[] = [];

    for (const domain of domains) {
      try {
        const metrics = await this.checkDomainHealth(domain.domain);
        healthChecks.push({
          domain: domain.domain,
          domain_id: domain.id,
          metrics
        });
      } catch (error) {
        console.warn(`Failed to check health for ${domain.domain}:`, error);
      }
    }

    return healthChecks;
  }

  async performMaintenance(domain: string, metrics: HealthMetrics): Promise<void> {
    if (metrics.missingEmbeddings > 0) {
      console.log('   (This would trigger embedding generation job)');
    }

    if (metrics.staleEmbeddings > 0) {
      console.log('   (This would trigger re-embedding job)');
    }

    if (metrics.coverage >= 90 && metrics.staleEmbeddings === 0) {
    }
  }

  async watch(intervalSeconds: number, callback: (health: DomainHealth[]) => void): Promise<void> {
    const check = async () => {
      try {
        const health = await this.checkHealth();
        if (Array.isArray(health)) {
          callback(health);
        }
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    };

    await check();
    setInterval(check, intervalSeconds * 1000);
  }
}
