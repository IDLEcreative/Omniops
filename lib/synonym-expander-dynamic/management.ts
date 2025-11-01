/**
 * Synonym Management Operations
 */

import { DynamicSynonymExpanderCore } from './core';

export class DynamicSynonymExpanderManagement extends DynamicSynonymExpanderCore {
  /**
   * Add a domain-specific synonym
   */
  public async addDomainSynonym(
    domainId: string,
    term: string,
    synonyms: string[]
  ): Promise<boolean> {
    const supabase = this.getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase
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

      this.setDomain(domainId);

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
      return;
    }

    const supabase = this.getSupabase();
    if (!supabase) return;

    try {
      const { error } = await supabase.rpc('learn_domain_synonym', {
        p_domain_id: domainId,
        p_original_term: originalTerm.toLowerCase(),
        p_matched_term: matchedTerm.toLowerCase(),
        p_confidence: confidence
      });

      if (error) {
        console.error('[SynonymExpander] Error learning synonym:', error);
      }
    } catch (error) {
      console.error('[SynonymExpander] Error learning synonym:', error);
    }
  }

  /**
   * Get all synonyms for a domain
   */
  public async getDomainSynonyms(domainId: string): Promise<any[]> {
    const supabase = this.getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
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
    const supabase = this.getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('domain_synonym_mappings')
        .delete()
        .eq('domain_id', domainId)
        .eq('term', term.toLowerCase());

      if (error) {
        console.error('[SynonymExpander] Error deleting synonym:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[SynonymExpander] Error deleting synonym:', error);
      return false;
    }
  }
}
