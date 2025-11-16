/**
 * Response formatting utilities for conversational refinement simulation
 */

import { MockProduct } from './types';

export function formatCategoryGroupResponse(
  query: string,
  groups: Map<string, MockProduct[]>,
  totalCount: number
): string {
  const categoryList = Array.from(groups.entries())
    .map(([category, products]) => {
      const avgSimilarity =
        products.reduce((sum, p) => sum + p.similarity_score, 0) /
        products.length;
      return `- **${category}** (${products.length} products, ${Math.round(avgSimilarity * 100)}% match)`;
    })
    .join('\n');

  return `I found ${totalCount} products. Based on your search, I see:\n${categoryList}\n\nWhich type are you interested in?`;
}

export function formatPriceRangeResponse(
  budgetCount: number,
  midRangeCount: number,
  premiumCount: number
): string {
  return `Would you like to see:\n- Budget options (under £50): ${budgetCount} products\n- Mid-range options (£50-£150): ${midRangeCount} products\n- Premium options (over £150): ${premiumCount} products`;
}

export function formatStockAvailabilityResponse(
  inStockCount: number,
  backorderCount: number,
  outOfStockCount: number
): string {
  return `I found:\n- In stock (${inStockCount} products) - Available now\n- On backorder (${backorderCount} products) - 2-3 week delivery\n- Out of stock (${outOfStockCount} products) - Not currently available\n\nWould you like to see in-stock options first?`;
}

export function formatMatchQualityResponse(
  excellentCount: number,
  goodCount: number,
  moderateCount: number
): string {
  return `I found products with varying match quality:\n- Excellent match (90-100%): ${excellentCount} products\n- Good match (75-89%): ${goodCount} products\n- Moderate match (60-74%): ${moderateCount} products\n\nWould you like to see the excellent matches first?`;
}

export function formatRankingBasedResponse(
  topMatches: MockProduct[],
  allProducts: MockProduct[]
): string {
  const groups = groupByCategory(topMatches);
  const categoryList = Array.from(groups.entries())
    .map(
      ([category, products]) =>
        `${category} (${products.length} products, ${Math.round(products[0].similarity_score * 100)}% match)`
    )
    .join(', ');

  return `I found ${allProducts.length} options. The top matches (90%+ similarity) are: ${categoryList}. Which type interests you?`;
}

export function formatFinalResults(products: MockProduct[]): string {
  const productList = products
    .slice(0, 5)
    .map(
      (p, i) =>
        `${i + 1}. **${p.name}** - £${p.price.toFixed(2)} (${Math.round(p.similarity_score * 100)}% match)\n   ✅ ${p.stock_status === 'instock' ? 'In stock' : 'On backorder'}`
    )
    .join('\n\n');

  return `Perfect! Here are your top ${Math.min(products.length, 5)} options:\n\n${productList}`;
}

export function groupByCategory(
  products: MockProduct[]
): Map<string, MockProduct[]> {
  const groups = new Map<string, MockProduct[]>();

  products.forEach(product => {
    product.categories.forEach(category => {
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(product);
    });
  });

  return groups;
}

export function areResultsSimilar(products: MockProduct[]): boolean {
  const categories = new Set(products.flatMap(p => p.categories));
  if (categories.size > 1) return false;

  const scores = products.map(p => p.similarity_score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  return maxScore - minScore < 0.1;
}
