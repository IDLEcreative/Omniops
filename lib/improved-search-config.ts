/**
 * Improved Search Configuration
 * Extracted from improved-search.ts to maintain <300 LOC file length limit
 */

// IMPROVED CONFIGURATION BASED ON TESTING
export const IMPROVED_CONFIG = {
  // Lower similarity thresholds for better recall
  similarityThreshold: {
    default: 0.45,        // Down from 0.7
    products: 0.4,        // Even lower for products to catch all specs
    support: 0.5,         // Moderate for support content
    policy: 0.55          // Slightly higher for policies
  },

  // Increased chunk limits for complete context
  chunkLimits: {
    default: 20,          // Up from 10-15
    products: 25,         // Maximum for products
    support: 15,          // Good amount for support
    minimal: 8            // Minimum viable context
  },

  // Content-aware truncation lengths
  truncationLengths: {
    product: 2000,        // Full specs and descriptions
    support: 1500,        // Complete instructions
    policy: 1000,         // Full policy sections
    blog: 1200,           // Good blog content
    default: 800          // Standard content
  }
};

/**
 * Detect the type of query to optimize search parameters
 */
export function detectQueryType(query: string): 'product' | 'support' | 'policy' | 'general' {
  const queryLower = query.toLowerCase();

  // Product queries - need maximum context
  const productPatterns = [
    /\b(sku|part|product|item|model)\s*[:#]?\s*[A-Z0-9]+/i,
    /\b(specification|spec|dimension|capacity)\b/i,
    /\b(price|cost|buy|purchase)\b/i,
    /\b(hydraulic|pump|valve|motor|kit)\b/i,
    /\bdc\d{2}-\d+[a-z]?\b/i  // Part numbers like DC66-10P
  ];

  if (productPatterns.some(p => p.test(queryLower))) {
    return 'product';
  }

  // Support queries - need detailed instructions
  const supportPatterns = [
    /\b(how to|install|setup|configure|troubleshoot)\b/i,
    /\b(problem|issue|not working|error|fix)\b/i,
    /\b(guide|tutorial|instructions|steps)\b/i
  ];

  if (supportPatterns.some(p => p.test(queryLower))) {
    return 'support';
  }

  // Policy queries - need specific sections
  const policyPatterns = [
    /\b(policy|terms|conditions|warranty|return|refund)\b/i,
    /\b(shipping|delivery|privacy|guarantee)\b/i
  ];

  if (policyPatterns.some(p => p.test(queryLower))) {
    return 'policy';
  }

  return 'general';
}

/**
 * Get optimized search parameters based on query type
 */
export function getOptimizedSearchParams(queryType: 'product' | 'support' | 'policy' | 'general') {
  return {
    similarityThreshold: IMPROVED_CONFIG.similarityThreshold[queryType === 'general' ? 'default' : queryType === 'product' ? 'products' : queryType] || IMPROVED_CONFIG.similarityThreshold.default,
    chunkLimit: IMPROVED_CONFIG.chunkLimits[queryType === 'product' ? 'products' :
                queryType === 'support' ? 'support' : 'default'],
    truncationLength: IMPROVED_CONFIG.truncationLengths[queryType === 'general' ? 'default' : queryType === 'policy' ? 'default' : queryType] || IMPROVED_CONFIG.truncationLengths.default
  };
}
