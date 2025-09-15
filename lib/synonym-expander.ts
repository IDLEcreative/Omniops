/**
 * Synonym Expansion System for Query Enhancement
 * Improves search accuracy by mapping user terminology to product terminology
 */

export class SynonymExpander {
  // Comprehensive synonym mappings for Thompson's eParts domain
  private static synonymMap: Record<string, string[]> = {
    // Weather and environmental terms
    "tough": ["extreme", "harsh", "severe", "difficult", "challenging", "rugged"],
    "weather": ["climatic conditions", "climate", "environmental", "outdoor", "elements"],
    "extreme": ["tough", "harsh", "severe", "heavy duty", "industrial"],
    "conditions": ["weather", "environment", "climate", "circumstances"],
    
    // Equipment categories
    "forest equipment": ["forest loader", "forestry", "logging equipment", "timber equipment", "woodland machinery"],
    "forest": ["forestry", "woodland", "timber", "logging"],
    "loader": ["loading equipment", "crane", "lift", "hoist"],
    
    // Components and parts
    "tank": ["reservoir", "container", "vessel", "storage", "fuel tank", "hydraulic tank"],
    "hydraulic": ["hyd", "hydraulics", "fluid power", "hydraulic system"],
    "pump": ["hydraulic pump", "fluid pump", "pumping unit"],
    "valve": ["control valve", "hydraulic valve", "flow control"],
    "cylinder": ["hydraulic cylinder", "actuator", "ram"],
    "hose": ["hydraulic hose", "fluid line", "pipe", "tubing"],
    
    // Tools and equipment
    "chainsaw": ["chain saw", "saw", "cutting tool", "timber saw"],
    "blade": ["cutting blade", "saw blade", "cutter"],
    "chain": ["saw chain", "cutting chain", "chainsaw chain"],
    "bar": ["guide bar", "chainsaw bar", "cutting bar"],
    
    // Vehicle and machinery terms
    "tractor": ["agricultural tractor", "farm tractor", "machinery"],
    "excavator": ["digger", "earthmover", "excavating machine"],
    "truck": ["lorry", "vehicle", "transport"],
    "engine": ["motor", "power unit", "powerplant"],
    "transmission": ["gearbox", "drivetrain", "drive system"],
    
    // Maintenance and service
    "maintenance": ["service", "upkeep", "repair", "servicing"],
    "repair": ["fix", "mend", "restore", "service"],
    "replace": ["change", "swap", "substitute", "renew"],
    "filter": ["strainer", "screen", "filtration"],
    "oil": ["lubricant", "fluid", "hydraulic oil", "engine oil"],
    
    // Size and specifications
    "size": ["dimension", "measurement", "spec", "specification"],
    "diameter": ["width", "bore", "size"],
    "pressure": ["psi", "bar", "hydraulic pressure"],
    "flow": ["flow rate", "gpm", "lpm", "fluid flow"],
    
    // Brand variations (common misspellings and variations)
    "cat": ["caterpillar", "cat equipment"],
    "jd": ["john deere", "deere"],
    "komatsu": ["komatsu equipment"],
    "volvo": ["volvo equipment", "volvo machinery"],
    
    // Action words
    "buy": ["purchase", "order", "get", "acquire"],
    "need": ["require", "want", "looking for"],
    "find": ["search", "locate", "looking for"],
    "compatible": ["fits", "works with", "suitable for", "matches"],
    
    // Part conditions
    "new": ["brand new", "unused", "factory new"],
    "used": ["second hand", "pre-owned", "refurbished"],
    "oem": ["original", "genuine", "manufacturer", "factory"],
    "aftermarket": ["replacement", "alternative", "non-oem"],
    
    // Technical abbreviations
    "hp": ["horsepower", "power"],
    "rpm": ["revolutions per minute", "speed"],
    "psi": ["pounds per square inch", "pressure"],
    "gpm": ["gallons per minute", "flow rate"],
    "lpm": ["liters per minute", "litres per minute", "flow rate"]
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