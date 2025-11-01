/**
 * Category Mapping Builder
 */

import type { CategoryMapping, ExtractedCategory } from './types';
import { extractCategories } from './extractors';
import { isLikelyProductPage } from './detectors';
import { generatePattern, calculateConfidence } from './utilities';

export async function buildCategoryMappings(
  supabase: any
): Promise<Map<string, CategoryMapping>> {
  console.log('Building intelligent category mappings...');

  // Fetch all scraped product pages with pagination
  // ✅ Optimized: Only fetches needed columns (url, title, content)
  // ✅ Optimized: Uses pagination to handle 10,000+ pages safely
  const pages: Array<{ url: string; title: string; content: string }> = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('scraped_pages')
      .select('url, title, content')
      .eq('status', 'completed')
      .order('url')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Error fetching pages:', error);
      break;
    }

    if (batch && batch.length > 0) {
      pages.push(...batch);
      offset += batchSize;
      console.log(`Fetched ${pages.length} pages for category mapping...`);

      if (batch.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  if (pages.length === 0) {
    console.log('No pages found for category mapping');
    return new Map();
  }

  // Group products by detected patterns
  const categoryPatterns = new Map<string, Set<string>>();
  const categoryUrls = new Map<string, string>();

  for (const page of pages) {
    // Skip non-product pages
    if (!isLikelyProductPage(page.url, page.content)) continue;

    // Extract potential category from various sources
    const categories = extractCategories(page);

    for (const category of categories) {
      if (!categoryPatterns.has(category.name)) {
        categoryPatterns.set(category.name, new Set());
      }
      const patternSet = categoryPatterns.get(category.name);
      if (patternSet) {
        patternSet.add(page.url);
      }

      // Track potential category URL
      if (category.url && !categoryUrls.has(category.name)) {
        categoryUrls.set(category.name, category.url);
      }
    }
  }

  // Build final mappings with confidence scores
  const mappings = new Map<string, CategoryMapping>();

  for (const [category, urls] of categoryPatterns) {
    // Skip categories with too few products
    if (urls.size < 2) continue;

    mappings.set(category, {
      pattern: generatePattern(category, Array.from(urls)),
      category_name: category,
      category_url: categoryUrls.get(category) || undefined,
      product_count: urls.size,
      confidence: calculateConfidence(urls.size, pages.length)
    });
  }

  console.log(`Created ${mappings.size} category mappings`);
  return mappings;
}
