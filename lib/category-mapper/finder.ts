/**
 * Category Finding Logic
 */

import type { CategoryMapping } from './types';

export async function findCategoryForQuery(
  query: string,
  searchResults: any[],
  mappings: Map<string, CategoryMapping>
): Promise<{
  category: string;
  url?: string;
  confidence: number;
} | null> {
  // Count URLs by potential category
  const categoryCounts = new Map<string, number>();

  for (const result of searchResults) {
    if (!result.url) continue;

    // Check each category mapping
    for (const [categoryName, mapping] of mappings) {
      // Check if URL matches pattern
      if (result.url.includes(mapping.pattern) ||
          result.title?.toLowerCase().includes(categoryName.toLowerCase())) {
        categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1);
      }
    }
  }

  // Find category with most matches
  let bestCategory = null;
  let maxCount = 0;

  for (const [category, count] of categoryCounts) {
    if (count > maxCount && count >= searchResults.length * 0.4) { // At least 40% match
      maxCount = count;
      bestCategory = category;
    }
  }

  if (bestCategory && mappings.has(bestCategory)) {
    const mapping = mappings.get(bestCategory)!;
    return {
      category: bestCategory,
      url: mapping.category_url,
      confidence: maxCount / searchResults.length
    };
  }

  return null;
}
