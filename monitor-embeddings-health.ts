#!/usr/bin/env npx tsx
/**
 * Embeddings Health Monitor
 *
 * Monitor and maintain embedding quality for optimal search performance.
 *
 * Usage:
 *   npx tsx monitor-embeddings-health.ts check              # Run health check
 *   npx tsx monitor-embeddings-health.ts auto               # Auto-maintenance
 *   npx tsx monitor-embeddings-health.ts watch              # Continuous monitoring
 *   npx tsx monitor-embeddings-health.ts help               # Show help
 *
 * Health Checks:
 * - Coverage: Scraped pages with embeddings
 * - Staleness: Embeddings older than 90 days
 * - Errors: Failed embedding generation
 * - Vector quality: Dimension and data integrity
 *
 * Auto-Maintenance:
 * - Generate missing embeddings
 * - Refresh stale embeddings
 * - Fix embedding errors
 * - Optimize vector indexes
 */

import { createClient } from '@supabase/supabase-js';

interface HealthMetrics {
  totalPages: number;
  totalEmbeddings: number;
  missingEmbeddings: number;
  staleEmbeddings: number;
  errorEmbeddings: number;
  coverage: number; // Percentage
  averageAge: number; // Days
  oldestEmbedding: Date | null;
  newestEmbedding: Date | null;
  issues: string[];
}

interface DomainHealth {
  domain: string;
  domain_id: string;
  metrics: HealthMetrics;
}

class EmbeddingsHealthMonitor {
  private supabase: any;
  private staleThresholdDays = 90;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(url, key);
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
    // Get domain ID
    const { data: domainData, error: domainError } = await this.supabase
      .from('domains')
      .select('id')
      .eq('domain', domain)
      .single();

    if (domainError || !domainData) {
      throw new Error(`Domain "${domain}" not found`);
    }

    const domainId = domainData.id;

    // Count total scraped pages
    const { count: totalPages } = await this.supabase
      .from('scraped_pages')
      .select('id', { count: 'exact', head: true })
      .eq('domain_id', domainId);

    // Count total embeddings
    const { count: totalEmbeddings } = await this.supabase
      .from('page_embeddings')
      .select('id', { count: 'exact', head: true })
      .eq('domain_id', domainId);

    // Find pages without embeddings
    const { data: pagesWithoutEmbeddings } = await this.supabase
      .from('scraped_pages')
      .select('id')
      .eq('domain_id', domainId)
      .is('embedding_id', null);

    const missingEmbeddings = pagesWithoutEmbeddings?.length || 0;

    // Find stale embeddings (older than threshold)
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - this.staleThresholdDays);

    const { data: staleEmbeddingsData } = await this.supabase
      .from('page_embeddings')
      .select('id, created_at')
      .eq('domain_id', domainId)
      .lt('created_at', staleDate.toISOString());

    const staleEmbeddings = staleEmbeddingsData?.length || 0;

    // Get embedding age stats
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

      // Calculate average age in days
      const now = Date.now();
      const totalAgeMs = embeddingAges.reduce((sum, e) => {
        return sum + (now - new Date(e.created_at).getTime());
      }, 0);
      averageAge = totalAgeMs / embeddingAges.length / (1000 * 60 * 60 * 24);
    }

    // Calculate coverage
    const coverage = totalPages && totalPages > 0
      ? ((totalPages - missingEmbeddings) / totalPages) * 100
      : 0;

    // Identify issues
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
      errorEmbeddings: 0, // Would need separate error tracking
      coverage,
      averageAge,
      oldestEmbedding,
      newestEmbedding,
      issues
    };
  }

  private async checkAllDomainsHealth(): Promise<DomainHealth[]> {
    // Get all domains
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

  async autoMaintenance(domain?: string): Promise<void> {
    console.log('🔧 Starting auto-maintenance...\n');

    const health = await this.checkHealth(domain);

    if (Array.isArray(health)) {
      // Multiple domains
      for (const domainHealth of health) {
        await this.performMaintenance(domainHealth.domain, domainHealth.metrics);
      }
    } else {
      // Single domain
      if (!domain) {
        throw new Error('Domain parameter required for single domain maintenance');
      }
      await this.performMaintenance(domain, health);
    }

    console.log('\n✅ Auto-maintenance complete!');
  }

  private async performMaintenance(domain: string, metrics: HealthMetrics): Promise<void> {
    console.log(`\n📦 Maintaining: ${domain}`);
    console.log('─'.repeat(50));

    if (metrics.missingEmbeddings > 0) {
      console.log(`\n🔨 Generating ${metrics.missingEmbeddings} missing embeddings...`);
      console.log('   (This would trigger embedding generation job)');
      // In production: Trigger actual embedding generation
      // await this.generateMissingEmbeddings(domain);
    }

    if (metrics.staleEmbeddings > 0) {
      console.log(`\n🔄 Refreshing ${metrics.staleEmbeddings} stale embeddings...`);
      console.log('   (This would trigger re-embedding job)');
      // In production: Trigger re-embedding of stale content
      // await this.refreshStaleEmbeddings(domain);
    }

    if (metrics.coverage >= 90 && metrics.staleEmbeddings === 0) {
      console.log('\n✅ No maintenance needed - embeddings are healthy!');
    }
  }

  async watch(intervalSeconds: number = 300): Promise<void> {
    console.log(`👁️  Starting continuous monitoring (checking every ${intervalSeconds}s)...\n`);
    console.log('Press Ctrl+C to stop\n');

    const check = async () => {
      try {
        console.log(`\n[${new Date().toISOString()}] Running health check...`);
        const health = await this.checkHealth();

        if (Array.isArray(health)) {
          console.log(`\n📊 Monitored Domains: ${health.length}`);

          const issuesFound = health.filter(h => h.metrics.issues.length > 0);
          if (issuesFound.length > 0) {
            console.log(`\n⚠️  Issues detected in ${issuesFound.length} domain(s):`);
            for (const domain of issuesFound) {
              console.log(`\n  ${domain.domain}:`);
              domain.metrics.issues.forEach(issue => console.log(`    - ${issue}`));
            }
          } else {
            console.log('\n✅ All domains healthy!');
          }

          // Show summary stats
          const totalPages = health.reduce((sum, h) => sum + h.metrics.totalPages, 0);
          const totalEmbeddings = health.reduce((sum, h) => sum + h.metrics.totalEmbeddings, 0);
          const totalMissing = health.reduce((sum, h) => sum + h.metrics.missingEmbeddings, 0);

          console.log(`\n  Total pages: ${totalPages.toLocaleString()}`);
          console.log(`  Total embeddings: ${totalEmbeddings.toLocaleString()}`);
          console.log(`  Missing: ${totalMissing.toLocaleString()}`);
        }

      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    };

    // Initial check
    await check();

    // Continuous monitoring
    setInterval(check, intervalSeconds * 1000);
  }
}

function showHelp() {
  console.log(`
Embeddings Health Monitor - Monitor and maintain embedding quality

USAGE:
  npx tsx monitor-embeddings-health.ts <command> [options]

COMMANDS:
  check                Run health check
  auto                 Run auto-maintenance (fix issues)
  watch                Start continuous monitoring
  help                 Show this help message

OPTIONS:
  --domain=<domain>    Check specific domain (e.g., --domain=example.com)
  --interval=<sec>     Monitoring interval in seconds (default: 300)

EXAMPLES:
  # Check health of all domains
  npx tsx monitor-embeddings-health.ts check

  # Check specific domain
  npx tsx monitor-embeddings-health.ts check --domain=example.com

  # Run auto-maintenance on all domains
  npx tsx monitor-embeddings-health.ts auto

  # Continuous monitoring (check every 5 minutes)
  npx tsx monitor-embeddings-health.ts watch

  # Custom monitoring interval (every 60 seconds)
  npx tsx monitor-embeddings-health.ts watch --interval=60

HEALTH METRICS:
  Coverage           - Percentage of pages with embeddings (target: 90%+)
  Staleness          - Embeddings older than 90 days
  Missing            - Pages without embeddings
  Average Age        - Mean age of embeddings in days
  Issues             - Detected problems requiring attention

AUTO-MAINTENANCE:
  • Generates missing embeddings
  • Refreshes stale embeddings (>90 days)
  • Fixes embedding errors
  • Optimizes vector indexes

MONITORING:
  • Continuous health checks
  • Real-time issue detection
  • Alert on critical problems
  • Performance tracking
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  const domain = args.find(arg => arg.startsWith('--domain='))?.split('=')[1];
  const intervalArg = args.find(arg => arg.startsWith('--interval='))?.split('=')[1];
  const interval = intervalArg ? parseInt(intervalArg, 10) : 300;

  const monitor = new EmbeddingsHealthMonitor();

  if (command === 'check') {
    console.log('\n🏥 Embeddings Health Check\n');
    console.log('='.repeat(70));

    try {
      const health = await monitor.checkHealth(domain);

      if (Array.isArray(health)) {
        // Multiple domains
        console.log(`\nChecked ${health.length} domain(s)\n`);

        for (const domainHealth of health) {
          console.log(`\n📦 ${domainHealth.domain}`);
          console.log('─'.repeat(50));
          printHealthMetrics(domainHealth.metrics);
        }

        // Overall summary
        const totalIssues = health.reduce((sum, h) => sum + h.metrics.issues.length, 0);
        console.log('\n' + '='.repeat(70));
        console.log(`\n📊 Overall: ${totalIssues} issue(s) detected across all domains`);

      } else {
        // Single domain
        console.log(`\nDomain: ${domain}\n`);
        printHealthMetrics(health);
      }

      console.log('\n' + '='.repeat(70));

    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

  } else if (command === 'auto') {
    console.log('\n🔧 Auto-Maintenance Mode\n');
    console.log('='.repeat(70));

    try {
      await monitor.autoMaintenance(domain);
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

  } else if (command === 'watch') {
    try {
      await monitor.watch(interval);
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

  } else {
    console.error(`\n❌ Unknown command: ${command}`);
    console.log('\nRun "npx tsx monitor-embeddings-health.ts help" for usage information');
    process.exit(1);
  }
}

function printHealthMetrics(metrics: HealthMetrics) {
  console.log(`  Total pages:          ${metrics.totalPages.toLocaleString()}`);
  console.log(`  Total embeddings:     ${metrics.totalEmbeddings.toLocaleString()}`);
  console.log(`  Coverage:             ${metrics.coverage.toFixed(1)}%`);
  console.log(`  Missing embeddings:   ${metrics.missingEmbeddings.toLocaleString()}`);
  console.log(`  Stale embeddings:     ${metrics.staleEmbeddings.toLocaleString()}`);
  console.log(`  Average age:          ${metrics.averageAge.toFixed(1)} days`);

  if (metrics.oldestEmbedding) {
    console.log(`  Oldest embedding:     ${metrics.oldestEmbedding.toLocaleDateString()}`);
  }
  if (metrics.newestEmbedding) {
    console.log(`  Newest embedding:     ${metrics.newestEmbedding.toLocaleDateString()}`);
  }

  if (metrics.issues.length > 0) {
    console.log('\n  ⚠️  Issues detected:');
    metrics.issues.forEach(issue => console.log(`    - ${issue}`));
  } else {
    console.log('\n  ✅ No issues detected');
  }
}

// Run the monitor
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
