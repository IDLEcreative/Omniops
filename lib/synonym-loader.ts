/**
 * Database-Driven Synonym Loader
 * Loads synonyms from domain_synonym_mappings table
 * Replaces hardcoded synonym mappings with database-backed system
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';

interface DomainSynonym {
  term: string;
  synonyms: string[];
}

interface SynonymCache {
  data: Map<string, string[]>;
  timestamp: number;
}

export class DomainSynonymLoader {
  private cache: Map<string, SynonymCache> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private supabase: any;

  constructor() {
    this.supabase = createServiceRoleClientSync();
  }

  /**
   * Load synonyms for a specific domain
   * Includes domain-specific + global (*) synonyms
   * Returns Map<term, [synonyms]>
   */
  async loadSynonymsForDomain(domainId: string): Promise<Map<string, string[]>> {
    // Check cache first
    const cached = this.cache.get(domainId);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    // Load from database

    try {
      const { data, error } = await this.supabase
        .from('domain_synonym_mappings')
        .select('term, synonyms')
        .eq('domain_id', domainId);

      if (error) {
        console.error('[SynonymLoader] Error loading domain synonyms:', error);
      }

      // Also load global synonyms that are safe for all
      const { data: globalData, error: globalError } = await this.supabase
        .from('global_synonym_mappings')
        .select('term, synonyms, is_safe_for_all')
        .eq('is_safe_for_all', true);

      if (globalError) {
        console.error('[SynonymLoader] Error loading global synonyms:', globalError);
      }

      // Combine domain + global synonyms
      const allSynonyms = [...(data || []), ...(globalData || [])];
      const synonymMap = this.formatSynonyms(allSynonyms);

      // Update cache
      this.cache.set(domainId, {
        data: synonymMap,
        timestamp: Date.now()
      });


      return synonymMap;
    } catch (error) {
      console.error('[SynonymLoader] Error loading synonyms:', error);
      return new Map();
    }
  }

  /**
   * Format synonyms into Map<term, [synonyms]>
   * Handles both domain_synonym_mappings (text[]) and global_synonym_mappings (text[])
   */
  private formatSynonyms(data: DomainSynonym[]): Map<string, string[]> {
    const synonymMap = new Map<string, string[]>();

    for (const { term, synonyms } of data) {
      const normalizedTerm = term.toLowerCase();

      if (!synonymMap.has(normalizedTerm)) {
        synonymMap.set(normalizedTerm, []);
      }

      const existingSynonyms = synonymMap.get(normalizedTerm)!;

      // Add new synonyms, avoiding duplicates
      for (const synonym of synonyms) {
        const normalizedSyn = synonym.toLowerCase();
        if (!existingSynonyms.includes(normalizedSyn)) {
          existingSynonyms.push(normalizedSyn);
        }
      }
    }

    return synonymMap;
  }

  /**
   * Get synonyms for a specific term
   */
  async getSynonymsForTerm(domainId: string, term: string): Promise<string[]> {
    const allSynonyms = await this.loadSynonymsForDomain(domainId);
    const normalizedTerm = term.toLowerCase();
    return allSynonyms.get(normalizedTerm) || [];
  }

  /**
   * Expand a query with synonyms
   */
  async expandQuery(domainId: string, query: string, maxExpansions: number = 3): Promise<string> {
    const synonymMap = await this.loadSynonymsForDomain(domainId);
    const words = query.toLowerCase().split(/\s+/);
    const expandedTerms: Set<string> = new Set(words);

    for (const word of words) {
      const synonyms = synonymMap.get(word);
      if (synonyms) {
        // Add limited number of synonyms
        synonyms.slice(0, maxExpansions).forEach(syn => expandedTerms.add(syn));
      }
    }

    return Array.from(expandedTerms).join(' ');
  }

  /**
   * Clear cache for a domain (useful after updates)
   */
  clearCache(domainId?: string) {
    if (domainId) {
      this.cache.delete(domainId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedDomains: this.cache.size,
      domains: Array.from(this.cache.keys()),
      totalMappings: Array.from(this.cache.values())
        .reduce((sum, cache) => sum + cache.data.size, 0)
    };
  }
}

// Singleton instance
export const synonymLoader = new DomainSynonymLoader();
