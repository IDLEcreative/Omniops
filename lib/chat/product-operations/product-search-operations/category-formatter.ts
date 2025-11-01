/**
 * Category formatting utilities
 */

import type { CategoryInfo } from './types';

/**
 * Format category list into hierarchical message
 */
export function formatCategoryMessage(
  categoryList: CategoryInfo[],
  page: number,
  perPage: number
): string {
  let message = `Found ${categoryList.length} categories on this page:\n\n`;

  // Group by top-level categories
  const topLevel = categoryList.filter(c => c.parent === 0);
  const subCategories = categoryList.filter(c => c.parent !== 0);

  topLevel.forEach(category => {
    message += `📁 ${category.name} (${category.count} products)\n`;

    // Show subcategories
    const subs = subCategories.filter(s => s.parent === category.id);
    subs.forEach(sub => {
      message += `  └─ ${sub.name} (${sub.count} products)\n`;
    });
  });

  // Show orphaned subcategories (parent not in result set)
  const orphaned = subCategories.filter(s => !topLevel.find(t => t.id === s.parent));
  if (orphaned.length > 0) {
    message += `\nOther categories:\n`;
    orphaned.forEach(cat => {
      message += `📁 ${cat.name} (${cat.count} products)\n`;
    });
  }

  return message;
}

/**
 * Map raw category data to CategoryInfo
 */
export function mapCategoriesToInfo(categories: any[]): CategoryInfo[] {
  return categories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parent: cat.parent,
    description: cat.description || '',
    count: cat.count
  }));
}
