/**
 * Dynamic Synonym Expansion - Core Logic
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';

export class DynamicSynonymExpanderCore {
  private supabase: any = null;
  private domainId: string | null = null;
  private cache: Map<string, string[]> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheTime: number = 0;

  /**
   * Initialize Supabase client if not already initialized
   */
  private initializeSupabase(): void {
    if (!this.supabase) {
      this.supabase = createServiceRoleClientSync();

      if (!this.supabase) {
        console.warn('[SynonymExpander] Database service unavailable, synonyms disabled');
      }
    }
  }

  /**
   * Set the current domain context
   */
  public setDomain(domainId: string | null): void {
    if (this.domainId !== domainId) {
      this.domainId = domainId;
      this.clearCache();
    }
  }

  /**
   * Clear the synonym cache
   */
  private clearCache(): void {
    this.cache.clear();
    this.lastCacheTime = 0;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheTime < this.cacheExpiry;
  }

  /**
   * Load synonyms from database for a specific term
   */
  public async loadSynonymsForTerm(term: string): Promise<string[]> {
    this.initializeSupabase();

    if (!this.supabase) {
      return [];
    }

    if (!this.domainId) {
      console.warn('[SynonymExpander] No domain set, using only global synonyms');
    }

    try {
      const cacheKey = `${this.domainId || 'global'}_${term.toLowerCase()}`;
      if (this.isCacheValid() && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      const synonyms: string[] = [];

      // Load domain-specific synonyms
      if (this.domainId) {
        const { data: domainSynonyms, error: domainError } = await this.supabase
          .from('domain_synonym_mappings')
          .select('synonyms')
          .eq('domain_id', this.domainId)
          .ilike('term', term)
          .single();

        if (!domainError && domainSynonyms?.synonyms) {
          synonyms.push(...domainSynonyms.synonyms);
        }
      }

      // Load global safe synonyms
      const { data: globalSynonyms, error: globalError } = await this.supabase
        .from('global_synonym_mappings')
        .select('synonyms')
        .eq('is_safe_for_all', true)
        .ilike('term', term)
        .single();

      if (!globalError && globalSynonyms?.synonyms) {
        const globalSyns = globalSynonyms.synonyms.filter(
          (syn: string) => !synonyms.includes(syn)
        );
        synonyms.push(...globalSyns);
      }

      this.cache.set(cacheKey, synonyms);
      this.lastCacheTime = Date.now();

      return synonyms;
    } catch (error) {
      console.error('[SynonymExpander] Error loading synonyms:', error);
      return [];
    }
  }

  /**
   * Expand a query with domain-specific synonyms
   */
  public async expandQuery(
    query: string,
    domainId?: string,
    maxExpansions: number = 3
  ): Promise<string> {
    if (domainId) {
      this.setDomain(domainId);
    }

    const words = query.toLowerCase().split(/\s+/);
    const expandedTerms: Set<string> = new Set(words);

    for (const word of words) {
      const synonyms = await this.loadSynonymsForTerm(word);
      synonyms.slice(0, maxExpansions).forEach(syn => {
        expandedTerms.add(syn.toLowerCase());
      });
    }

    return Array.from(expandedTerms).join(' ');
  }

  protected getSupabase() {
    this.initializeSupabase();
    return this.supabase;
  }

  protected getDomainId() {
    return this.domainId;
  }
}
