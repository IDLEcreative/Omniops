/**
 * Automatic Synonym Learning System
 * Analyzes scraped content to build domain-specific synonym mappings
 */

import { createClient } from '@supabase/supabase-js';
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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  /**
   * Analyze scraped content and build synonym mappings for a domain
   */
  public async learnFromScrapedContent(domainId: string, domain: string): Promise<void> {
    console.log(`[SynonymLearner] Starting automatic synonym learning for ${domain}`);
    
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
      
      console.log(`[SynonymLearner] Analyzing ${pages.length} pages for patterns...`);
      
      // Extract terms and patterns
      const extractedTerms = this.extractTermsFromContent(pages);
      
      // Build synonym relationships
      const synonymGroups = this.buildSynonymGroups(extractedTerms);
      
      // Store in database
      await this.storeSynonyms(domainId, synonymGroups);
      
      console.log(`[SynonymLearner] Learned ${synonymGroups.length} synonym groups for ${domain}`);
      
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
      
      // Bracketed variations: pump (hydraulic), tank (fuel)
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
      while ((match = patterns.bracketed.exec(content)) !== null) {
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
      while ((match = patterns.slashed.exec(content)) !== null) {
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
   * Full Thompson's eParts synonym mapping
   */
  public async setupThompsonsSynonyms(domainId: string): Promise<void> {
    console.log('[SynonymLearner] Setting up comprehensive Thompson\'s eParts synonyms...');
    
    const thompsonsSynonyms = [
      // Equipment categories
      { term: 'forest equipment', synonyms: ['forest loader', 'forestry equipment', 'logging equipment', 'timber equipment', 'woodland machinery', 'forest machinery'] },
      { term: 'agricultural equipment', synonyms: ['farm equipment', 'farming machinery', 'agricultural machinery', 'ag equipment'] },
      { term: 'construction equipment', synonyms: ['building equipment', 'construction machinery', 'earthmoving equipment'] },
      
      // Hydraulic systems
      { term: 'hydraulic', synonyms: ['hyd', 'hydraulics', 'fluid power', 'hydraulic system', 'hydraulic powered'] },
      { term: 'hydraulic pump', synonyms: ['hyd pump', 'fluid pump', 'hydraulic pumping unit', 'pump unit'] },
      { term: 'hydraulic cylinder', synonyms: ['hyd cylinder', 'hydraulic ram', 'actuator', 'hydraulic actuator'] },
      { term: 'hydraulic valve', synonyms: ['control valve', 'flow control valve', 'directional valve', 'hyd valve'] },
      { term: 'hydraulic hose', synonyms: ['hyd hose', 'hydraulic line', 'fluid line', 'pressure hose'] },
      { term: 'hydraulic filter', synonyms: ['hyd filter', 'fluid filter', 'oil filter', 'return filter'] },
      { term: 'hydraulic tank', synonyms: ['hydraulic reservoir', 'oil tank', 'fluid reservoir', 'hyd tank'] },
      { term: 'hydraulic oil', synonyms: ['hydraulic fluid', 'hyd oil', 'hyd fluid', 'hydraulic lubricant'] },
      
      // Chainsaw components
      { term: 'chainsaw', synonyms: ['chain saw', 'power saw', 'cutting saw', 'timber saw'] },
      { term: 'chainsaw blade', synonyms: ['saw blade', 'cutting blade', 'chain blade'] },
      { term: 'chainsaw chain', synonyms: ['saw chain', 'cutting chain', 'chain'] },
      { term: 'chainsaw bar', synonyms: ['guide bar', 'cutting bar', 'bar'] },
      { term: 'chainsaw sprocket', synonyms: ['drive sprocket', 'chain sprocket'] },
      
      // Equipment types
      { term: 'excavator', synonyms: ['digger', 'earthmover', 'excavating machine', 'backhoe'] },
      { term: 'loader', synonyms: ['loading equipment', 'front loader', 'wheel loader', 'loading machine'] },
      { term: 'tractor', synonyms: ['agricultural tractor', 'farm tractor', 'tractor unit'] },
      { term: 'forklift', synonyms: ['fork truck', 'lift truck', 'fork lift'] },
      { term: 'crane', synonyms: ['lifting crane', 'hoist', 'lifting equipment'] },
      { term: 'bulldozer', synonyms: ['dozer', 'crawler', 'earthmover'] },
      
      // Brands (common variations)
      { term: 'cat', synonyms: ['caterpillar', 'cat equipment', 'caterpillar equipment'] },
      { term: 'jd', synonyms: ['john deere', 'deere', 'john deere equipment'] },
      { term: 'jcb', synonyms: ['jcb equipment', 'j.c.b'] },
      { term: 'komatsu', synonyms: ['komatsu equipment'] },
      { term: 'volvo', synonyms: ['volvo equipment', 'volvo machinery'] },
      { term: 'hitachi', synonyms: ['hitachi equipment'] },
      { term: 'case', synonyms: ['case equipment', 'case machinery'] },
      { term: 'bobcat', synonyms: ['bobcat equipment'] },
      
      // Environmental conditions
      { term: 'tough', synonyms: ['extreme', 'harsh', 'severe', 'difficult', 'challenging', 'rugged', 'heavy duty'] },
      { term: 'weather', synonyms: ['climate', 'conditions', 'environmental conditions', 'outdoor conditions'] },
      { term: 'extreme conditions', synonyms: ['harsh conditions', 'severe conditions', 'tough conditions', 'challenging conditions'] },
      
      // Parts and components
      { term: 'bearing', synonyms: ['ball bearing', 'roller bearing', 'bearing unit'] },
      { term: 'seal', synonyms: ['oil seal', 'shaft seal', 'sealing ring', 'gasket'] },
      { term: 'filter', synonyms: ['strainer', 'screen', 'filtration element'] },
      { term: 'belt', synonyms: ['drive belt', 'v-belt', 'timing belt', 'conveyor belt'] },
      { term: 'gear', synonyms: ['cog', 'gear wheel', 'transmission gear'] },
      { term: 'shaft', synonyms: ['drive shaft', 'axle', 'spindle'] },
      { term: 'piston', synonyms: ['plunger', 'ram'] },
      
      // Measurements and specifications
      { term: 'pressure', synonyms: ['psi', 'bar', 'hydraulic pressure', 'operating pressure'] },
      { term: 'flow rate', synonyms: ['flow', 'gpm', 'lpm', 'gallons per minute', 'liters per minute'] },
      { term: 'horsepower', synonyms: ['hp', 'power', 'engine power'] },
      { term: 'torque', synonyms: ['turning force', 'rotational force'] },
      { term: 'capacity', synonyms: ['volume', 'size', 'load capacity'] },
      
      // Actions and conditions
      { term: 'repair', synonyms: ['fix', 'mend', 'service', 'maintenance', 'overhaul'] },
      { term: 'replace', synonyms: ['change', 'swap', 'substitute', 'renew', 'exchange'] },
      { term: 'install', synonyms: ['fit', 'mount', 'attach', 'setup', 'assemble'] },
      { term: 'compatible', synonyms: ['fits', 'works with', 'suitable for', 'matches', 'fits with'] },
      { term: 'oem', synonyms: ['original', 'genuine', 'factory', 'manufacturer original'] },
      { term: 'aftermarket', synonyms: ['replacement', 'alternative', 'non-oem', 'pattern part'] },
      
      // Materials
      { term: 'steel', synonyms: ['metal', 'iron', 'alloy steel'] },
      { term: 'rubber', synonyms: ['elastomer', 'synthetic rubber'] },
      { term: 'plastic', synonyms: ['polymer', 'synthetic', 'composite'] }
    ];
    
    // Store all synonyms
    for (const group of thompsonsSynonyms) {
      await synonymExpander.addDomainSynonym(domainId, group.term, group.synonyms);
    }
    
    console.log(`[SynonymLearner] Added ${thompsonsSynonyms.length} comprehensive synonym groups for Thompson's eParts`);
  }
}

// Export singleton
export const synonymLearner = new SynonymAutoLearner();