/**
 * Automatic Synonym Learning System
 * Analyzes scraped content to build domain-specific synonym mappings
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import { synonymExpander } from './synonym-expander-dynamic';

interface ExtractedTerm {
  term: string;
  variations: string[];
  frequency: number;
  contexts: string[];
}

export class SynonymAutoLearner {
  private supabase: any;

  constructor() {
    this.supabase = createServiceRoleClientSync();
  }

  /**
   * Analyze scraped content and build synonym mappings for a domain
   */
  public async learnFromScrapedContent(domainId: string, domain: string): Promise<void> {
    
    // Check if supabase client is initialized
    if (!this.supabase) {
      console.error('[SynonymLearner] Supabase client not initialized');
      return;
    }
    
    try {
      // Get sample of scraped content
      const { data: pages, error } = await this.supabase
        .from('scraped_pages')
        .select('title, content, metadata')
        .eq('domain', domain)
        .limit(100); // Analyze first 100 pages
      
      if (error || !pages) {
        console.error('[SynonymLearner] Error fetching pages:', error);
        return;
      }
      
      
      // Extract terms and patterns
      const extractedTerms = this.extractTermsFromContent(pages);
      
      // Build synonym relationships
      const synonymGroups = this.buildSynonymGroups(extractedTerms);
      
      // Store in database
      await this.storeSynonyms(domainId, synonymGroups);
      
      
    } catch (error) {
      console.error('[SynonymLearner] Error in learning process:', error);
    }
  }

  /**
   * Extract technical terms and patterns from content
   */
  private extractTermsFromContent(pages: any[]): Map<string, ExtractedTerm> {
    const termMap = new Map<string, ExtractedTerm>();
    
    // Patterns for technical terms
    const patterns = {
      // Product codes: ABC-123, 12.34.56
      productCode: /\b[A-Z]{2,}[-.]?\d+[-.]?[A-Z0-9]*\b/g,
      
      // Measurements: 100mm, 2.5", 3/4", 50kg
      measurement: /\b\d+(?:\.\d+)?(?:\/\d+)?\s*(?:mm|cm|m|km|kg|g|lb|oz|psi|bar|gpm|lpm|hp|"|'|inch|inches)\b/gi,
      
      // Technical compounds: heavy-duty, anti-freeze
      compound: /\b[a-z]+[-][a-z]+\b/gi,
      
      // Bracketed variations: product (type), item (category)
      bracketed: /\b(\w+)\s*\(([^)]+)\)/g,
      
      // Slash alternatives: loader/crane, indoor/outdoor
      slashed: /\b(\w+)\/(\w+)\b/g,
      
      // Brand model patterns: CAT 320D, JD 450
      brandModel: /\b[A-Z]{2,}\s+[A-Z0-9]+\b/g
    };
    
    for (const page of pages) {
      const content = `${page.title || ''} ${page.content || ''}`.toLowerCase();
      
      // Extract bracketed variations (these are often synonyms)
      let match;
      patterns.bracketed.lastIndex = 0; // Reset regex state
      while ((match = patterns.bracketed.exec(content)) !== null) {
        if (!match[1] || !match[2]) continue; // Skip if capture groups are undefined
        const mainTerm = match[1].toLowerCase();
        const variation = match[2].toLowerCase();
        
        if (!termMap.has(mainTerm)) {
          termMap.set(mainTerm, {
            term: mainTerm,
            variations: [],
            frequency: 0,
            contexts: []
          });
        }
        
        const entry = termMap.get(mainTerm)!;
        if (!entry.variations.includes(variation)) {
          entry.variations.push(variation);
        }
        entry.frequency++;
      }
      
      // Extract slash alternatives
      patterns.slashed.lastIndex = 0; // Reset regex state
      while ((match = patterns.slashed.exec(content)) !== null) {
        if (!match[1] || !match[2]) continue; // Skip if capture groups are undefined
        const term1 = match[1].toLowerCase();
        const term2 = match[2].toLowerCase();
        
        // These are likely synonyms
        if (!termMap.has(term1)) {
          termMap.set(term1, {
            term: term1,
            variations: [term2],
            frequency: 1,
            contexts: []
          });
        } else {
          const entry = termMap.get(term1)!;
          if (!entry.variations.includes(term2)) {
            entry.variations.push(term2);
          }
        }
      }
      
      // Extract compound terms
      const compounds = content.match(patterns.compound) || [];
      for (const compound of compounds) {
        const parts = compound.split('-');
        if (parts.length === 2) {
          // Map compound to individual parts
          const compoundLower = compound.toLowerCase();
          if (!termMap.has(compoundLower)) {
            termMap.set(compoundLower, {
              term: compoundLower,
              variations: parts,
              frequency: 1,
              contexts: []
            });
          }
        }
      }
    }
    
    return termMap;
  }

  /**
   * Build synonym groups from extracted terms
   */
  private buildSynonymGroups(extractedTerms: Map<string, ExtractedTerm>): Array<{term: string, synonyms: string[]}> {
    const groups: Array<{term: string, synonyms: string[]}> = [];
    
    // Filter to high-confidence relationships
    for (const [term, data] of extractedTerms) {
      if (data.variations.length > 0 && data.frequency >= 2) {
        groups.push({
          term,
          synonyms: data.variations
        });
      }
    }
    
    return groups;
  }

  /**
   * Store learned synonyms in database
   */
  private async storeSynonyms(domainId: string, synonymGroups: Array<{term: string, synonyms: string[]}>): Promise<void> {
    // Check if supabase client is initialized
    if (!this.supabase) {
      console.error('[SynonymLearner] Cannot store synonyms: Supabase client not initialized');
      return;
    }
    
    for (const group of synonymGroups) {
      try {
        await this.supabase
          .from('domain_synonym_mappings')
          .upsert({
            domain_id: domainId,
            term: group.term,
            synonyms: group.synonyms,
            weight: 0.8, // Learned synonyms get slightly lower weight
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'domain_id,term'
          });
      } catch (error) {
        console.error(`[SynonymLearner] Error storing synonym for ${group.term}:`, error);
      }
    }
  }

  /**
   * @deprecated This method was removed to enforce multi-tenant architecture.
   * Domain-specific synonyms should be loaded from the database via the
   * customer_configs table, not hardcoded in application code.
   *
   * Previously contained business-specific synonyms including:
   * - Product/service categories
   * - Industry-specific terminology
   * - Technical components and parts
   * - Product types
   * - Brand variations
   * - Measurements and specifications
   *
   * TODO: Implement database-driven synonym loading:
   * 1. Create domain_synonym_mappings table (already exists)
   * 2. Load synonyms at runtime based on domain (partially implemented)
   * 3. Support per-tenant synonym customization via admin UI
   * 4. Provide migration tool for legacy hardcoded synonyms
   */
}

// Export singleton
export const synonymLearner = new SynonymAutoLearner();