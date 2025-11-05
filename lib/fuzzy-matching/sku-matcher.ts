/**
 * SKU Fuzzy Matching Utility
 *
 * Implements Levenshtein distance algorithm to suggest similar SKUs
 * when exact matches fail.
 *
 * Use case: User mistypes "MU110667601" as "MU110667602" → suggest correct SKU
 */

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of single-character edits to transform one string into another)
 *
 * Uses dynamic programming for O(n*m) time complexity.
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Distance (number of edits required)
 *
 * @example
 * levenshteinDistance("MU110667601", "MU110667602") // 1 (one character different)
 * levenshteinDistance("ABC", "ABC") // 0 (exact match)
 * levenshteinDistance("kitten", "sitting") // 3
 */
function levenshteinDistance(str1: string, str2: string): number {
  // Normalize to lowercase for case-insensitive comparison
  const a = str1.toLowerCase();
  const b = str2.toLowerCase();

  const m = a.length;
  const n = b.length;

  // Early return for edge cases
  if (m === 0) return n;
  if (n === 0) return m;

  // Create DP matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill DP matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Find similar SKUs based on Levenshtein distance
 *
 * @param targetSku - The SKU being searched for
 * @param availableSkus - Array of SKUs in catalog
 * @param maxDistance - Maximum edit distance to consider (default: 2)
 * @param maxSuggestions - Maximum number of suggestions to return (default: 3)
 * @returns Array of similar SKUs sorted by similarity (closest first)
 *
 * @example
 * const skus = ["MU110667602", "MU110667611", "MU110667501", "ABC123"];
 * findSimilarSkus("MU110667601", skus, 2, 3)
 * // Returns: [
 * //   { sku: "MU110667602", distance: 1 },
 * //   { sku: "MU110667611", distance: 2 },
 * //   { sku: "MU110667501", distance: 2 }
 * // ]
 */
export function findSimilarSkus(
  targetSku: string,
  availableSkus: string[],
  maxDistance: number = 2,
  maxSuggestions: number = 3
): Array<{ sku: string; distance: number }> {
  // Calculate distance for all SKUs
  const skusWithDistance = availableSkus
    .map(sku => ({
      sku,
      distance: levenshteinDistance(targetSku, sku)
    }))
    // Filter to only include SKUs within max distance
    .filter(item => item.distance > 0 && item.distance <= maxDistance)
    // Sort by distance (closest first)
    .sort((a, b) => a.distance - b.distance)
    // Limit results
    .slice(0, maxSuggestions);

  return skusWithDistance;
}
