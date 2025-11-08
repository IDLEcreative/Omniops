/**
 * Synonym Expansion System for Query Enhancement
 * Improves search accuracy by mapping user terminology to product terminology
 */

export class SynonymExpander {
  // Comprehensive synonym mappings for product search enhancement
  // Note: This static map should eventually be replaced with database-driven
  // domain-specific synonyms loaded from the customer_configs table
  private static synonymMap: Record<string, string[]> = {
    // Quality and condition terms
    "tough": ["durable", "sturdy", "robust", "reliable", "heavy duty"],
    "conditions": ["environment", "circumstances", "requirements"],
    "extreme": ["intense", "severe", "heavy duty", "industrial"],

    // Generic equipment categories
    "equipment": ["device", "apparatus", "system"],
    "loader": ["handler", "system", "mechanism"],

    // Generic elements - Generic examples (load from database per customer)
    "container": ["reservoir", "vessel", "storage"],
    "fluid": ["liquid", "substance"],
    "product": ["equipment", "device", "item"],
    "regulator": ["controller", "control"],
    "element": ["unit", "piece"],
    "connection": ["link", "interface", "coupling"],

    // Tools and equipment (generic)
    "tool": ["implement", "device", "instrument"],
    "edge": ["side", "border"],
    "accessory": ["attachment", "add-on"],
    "unit": ["element", "piece"],

    // Generic machinery terms
    "machine": ["equipment", "apparatus", "system"],
    "vehicle": ["transport", "conveyance"],
    "device": ["unit", "equipment", "apparatus"],
    "system": ["assembly", "mechanism", "setup"],
    
    // Maintenance and service
    "maintenance": ["service", "upkeep", "repair", "servicing"],
    "repair": ["fix", "mend", "restore", "service"],
    "replace": ["change", "swap", "substitute", "renew"],
    "filter": ["strainer", "screen", "purifier"],

    // Size and specifications
    "size": ["dimension", "measurement", "spec", "specification"],
    "diameter": ["width", "size"],
    "pressure": ["force", "intensity"],
    "flow": ["rate", "throughput"],

    // Generic brand terms (examples only - load from database per customer)
    "standard": ["regular", "common", "typical"],
    "premium": ["high-end", "advanced", "superior"],
    "professional": ["commercial", "industrial", "trade"],

    // Action words
    "buy": ["purchase", "order", "get", "acquire"],
    "need": ["require", "want", "looking for"],
    "find": ["search", "locate", "looking for"],
    "compatible": ["fits", "works with", "suitable for", "matches"],

    // Condition terms
    "new": ["brand new", "unused", "fresh"],
    "used": ["pre-owned", "refurbished", "reconditioned"],
    "original": ["genuine", "authentic", "standard"],
    "alternative": ["replacement", "substitute", "equivalent"]
  };

  // Bidirectional mapping for comprehensive coverage
  private static reverseMap: Map<string, Set<string>> = new Map();

  // Initialize reverse mappings
  static {
    for (const [key, synonyms] of Object.entries(this.synonymMap)) {
      for (const synonym of synonyms) {
        if (!this.reverseMap.has(synonym.toLowerCase())) {
          this.reverseMap.set(synonym.toLowerCase(), new Set());
        }
        this.reverseMap.get(synonym.toLowerCase())!.add(key);
      }
    }
  }

  /**
   * Expand a query with synonyms
   * @param query Original search query
   * @param maxExpansions Maximum number of synonym expansions per term
   * @returns Expanded query with synonyms
   */
  public static expandQuery(query: string, maxExpansions: number = 3): string {
    const words = query.toLowerCase().split(/\s+/);
    const expandedTerms: Set<string> = new Set(words);
    
    // Process each word
    for (const word of words) {
      // Check direct synonyms
      if (this.synonymMap[word]) {
        const synonyms = this.synonymMap[word].slice(0, maxExpansions);
        synonyms.forEach(syn => expandedTerms.add(syn));
      }
      
      // Check reverse mappings
      if (this.reverseMap.has(word)) {
        const reverseSynonyms = Array.from(this.reverseMap.get(word)!).slice(0, maxExpansions);
        reverseSynonyms.forEach(syn => expandedTerms.add(syn));
      }
    }
    
    // Process multi-word phrases
    const expandedPhrases = this.expandPhrases(query, maxExpansions);
    expandedPhrases.forEach(phrase => expandedTerms.add(phrase));
    
    return Array.from(expandedTerms).join(' ');
  }

  /**
   * Expand multi-word phrases in the query
   */
  private static expandPhrases(query: string, maxExpansions: number): Set<string> {
    const expanded = new Set<string>();
    const lowerQuery = query.toLowerCase();
    
    // Check for known multi-word terms
    const multiWordTerms = Object.keys(this.synonymMap).filter(key => key.includes(' '));
    
    for (const term of multiWordTerms) {
      if (lowerQuery.includes(term)) {
        const termSynonyms = this.synonymMap[term];
        if (termSynonyms) {
          const synonyms = termSynonyms.slice(0, maxExpansions);
          synonyms.forEach(syn => expanded.add(syn));
        }
      }
    }
    
    return expanded;
  }

  /**
   * Get weighted synonyms for ranking purposes
   * Returns synonyms with confidence scores
   */
  public static getWeightedSynonyms(term: string): Array<{ synonym: string; weight: number }> {
    const results: Array<{ synonym: string; weight: number }> = [];
    const lowerTerm = term.toLowerCase();
    
    // Direct matches get highest weight
    if (this.synonymMap[lowerTerm]) {
      this.synonymMap[lowerTerm].forEach((syn, index) => {
        results.push({
          synonym: syn,
          weight: 1.0 - (index * 0.1) // Decrease weight by position
        });
      });
    }
    
    // Reverse matches get lower weight
    if (this.reverseMap.has(lowerTerm)) {
      Array.from(this.reverseMap.get(lowerTerm)!).forEach((syn, index) => {
        results.push({
          synonym: syn,
          weight: 0.7 - (index * 0.1)
        });
      });
    }
    
    return results;
  }

  /**
   * Check if two terms are synonymous
   */
  public static areSynonyms(term1: string, term2: string): boolean {
    const lower1 = term1.toLowerCase();
    const lower2 = term2.toLowerCase();
    
    if (lower1 === lower2) return true;
    
    // Check direct mapping
    if (this.synonymMap[lower1]?.includes(lower2)) return true;
    if (this.synonymMap[lower2]?.includes(lower1)) return true;
    
    // Check reverse mapping
    if (this.reverseMap.has(lower1) && this.reverseMap.get(lower1)!.has(lower2)) return true;
    if (this.reverseMap.has(lower2) && this.reverseMap.get(lower2)!.has(lower1)) return true;
    
    return false;
  }

  /**
   * Add custom synonyms at runtime
   */
  public static addSynonym(term: string, synonyms: string[]): void {
    const lowerTerm = term.toLowerCase();
    
    // Add to main map
    if (!this.synonymMap[lowerTerm]) {
      this.synonymMap[lowerTerm] = [];
    }
    this.synonymMap[lowerTerm].push(...synonyms);
    
    // Update reverse map
    for (const synonym of synonyms) {
      const lowerSyn = synonym.toLowerCase();
      if (!this.reverseMap.has(lowerSyn)) {
        this.reverseMap.set(lowerSyn, new Set());
      }
      this.reverseMap.get(lowerSyn)!.add(lowerTerm);
    }
  }

  /**
   * Extract domain-specific terms from content for learning
   */
  public static extractDomainTerms(content: string): string[] {
    // Pattern matching for technical terms
    const patterns = [
      /\b[A-Z]{2,}(?:\d+)?(?:-[A-Z0-9]+)*\b/g, // Part numbers
      /\b\d+(?:\.\d+)?(?:mm|cm|m|kg|lb|psi|bar|gpm|lpm|hp|rpm)\b/gi, // Measurements
      /\b(?:hydraulic|pneumatic|electronic|mechanical)\s+\w+/gi, // Technical terms
    ];
    
    const terms = new Set<string>();
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => terms.add(match.toLowerCase()));
      }
    }
    
    return Array.from(terms);
  }
}