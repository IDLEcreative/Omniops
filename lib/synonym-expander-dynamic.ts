/**
 * Dynamic Synonym Expansion System with Domain Isolation
 * Loads synonyms from database to prevent cross-domain contamination
 */

import { createClient } from '@supabase/supabase-js';

export class DynamicSynonymExpander {
  private supabase: any = null;
  private domainId: string | null = null;
  private cache: Map<string, string[]> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheTime: number = 0;

  constructor() {
    // Delay initialization until first use
  }

  /**
   * Initialize Supabase client if not already initialized
   */
  private initializeSupabase(): void {
    if (!this.supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (url && key) {
        this.supabase = createClient(url, key);
      } else {
        console.warn('[SynonymExpander] Supabase credentials not found, synonyms disabled');
      }
    }
  }

  /**
   * Set the current domain context
   */
  public setDomain(domainId: string | null): void {
    if (this.domainId !== domainId) {
      this.domainId = domainId;
      this.clearCache(); // Clear cache when domain changes
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
  private async loadSynonymsForTerm(term: string): Promise<string[]> {
    this.initializeSupabase();
    
    if (!this.supabase) {
      return []; // No database connection
    }
    
    if (!this.domainId) {
      console.warn('[SynonymExpander] No domain set, using only global synonyms');
    }

    try {
      // Check cache first
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
        // Add global synonyms but avoid duplicates
        const globalSyns = globalSynonyms.synonyms.filter(
          (syn: string) => !synonyms.includes(syn)
        );
        synonyms.push(...globalSyns);
      }

      // Cache the result
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
    // Set domain if provided
    if (domainId) {
      this.setDomain(domainId);
    }

    const words = query.toLowerCase().split(/\s+/);
    const expandedTerms: Set<string> = new Set(words);

    // Process each word
    for (const word of words) {
      const synonyms = await this.loadSynonymsForTerm(word);
      
      // Add limited number of synonyms
      synonyms.slice(0, maxExpansions).forEach(syn => {
        expandedTerms.add(syn.toLowerCase());
      });
    }

    return Array.from(expandedTerms).join(' ');
  }

  /**
   * Add a domain-specific synonym
   */
  public async addDomainSynonym(
    domainId: string,
    term: string,
    synonyms: string[]
  ): Promise<boolean> {
    this.initializeSupabase();
    if (!this.supabase) return false;
    
    try {
      const { error } = await this.supabase
        .from('domain_synonym_mappings')
        .upsert({
          domain_id: domainId,
          term: term.toLowerCase(),
          synonyms: synonyms.map(s => s.toLowerCase()),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'domain_id,term'
        });

      if (error) {
        console.error('[SynonymExpander] Error adding synonym:', error);
        return false;
      }

      // Clear cache for this domain
      this.setDomain(domainId);
      this.clearCache();
      
      return true;
    } catch (error) {
      console.error('[SynonymExpander] Error adding synonym:', error);
      return false;
    }
  }

  /**
   * Learn synonyms from successful queries
   */
  public async learnFromQuery(
    domainId: string,
    originalTerm: string,
    matchedTerm: string,
    confidence: number = 0.5
  ): Promise<void> {
    if (confidence < 0.7) {
      return; // Only learn high-confidence matches
    }

    this.initializeSupabase();
    if (!this.supabase) return;
    
    try {
      // Use the database function to learn
      const { error } = await this.supabase.rpc('learn_domain_synonym', {
        p_domain_id: domainId,
        p_original_term: originalTerm.toLowerCase(),
        p_matched_term: matchedTerm.toLowerCase(),
        p_confidence: confidence
      });

      if (error) {
        console.error('[SynonymExpander] Error learning synonym:', error);
      } else {
        // Clear cache to pick up new synonyms
        this.clearCache();
      }
    } catch (error) {
      console.error('[SynonymExpander] Error learning synonym:', error);
    }
  }

  /**
   * Get all synonyms for a domain (for management UI)
   */
  public async getDomainSynonyms(domainId: string): Promise<any[]> {
    this.initializeSupabase();
    if (!this.supabase) return [];
    
    try {
      const { data, error } = await this.supabase
        .from('domain_synonym_mappings')
        .select('*')
        .eq('domain_id', domainId)
        .order('term');

      if (error) {
        console.error('[SynonymExpander] Error fetching domain synonyms:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[SynonymExpander] Error fetching domain synonyms:', error);
      return [];
    }
  }

  /**
   * Delete a domain-specific synonym
   */
  public async deleteDomainSynonym(
    domainId: string,
    term: string
  ): Promise<boolean> {
    this.initializeSupabase();
    if (!this.supabase) return false;
    
    try {
      const { error } = await this.supabase
        .from('domain_synonym_mappings')
        .delete()
        .eq('domain_id', domainId)
        .eq('term', term.toLowerCase());

      if (error) {
        console.error('[SynonymExpander] Error deleting synonym:', error);
        return false;
      }

      // Clear cache
      this.clearCache();
      return true;
    } catch (error) {
      console.error('[SynonymExpander] Error deleting synonym:', error);
      return false;
    }
  }

  /**
   * @deprecated This method was removed to enforce multi-tenant architecture.
   * Domain-specific synonyms should be loaded from the database via the
   * customer_configs table, not hardcoded in application code.
   *
   * Previously contained Thompson's eParts-specific synonyms for equipment,
   * brands, and technical terms.
   *
   * TODO: Implement database-driven synonym loading:
   * 1. Create domain_synonym_mappings table (already exists)
   * 2. Load synonyms at runtime based on domain (already implemented via loadSynonymsForTerm)
   * 3. Support per-tenant synonym customization via admin UI
   * 4. Provide migration tool for legacy hardcoded synonyms
   */
}

// Export singleton instance
export const synonymExpander = new DynamicSynonymExpander();