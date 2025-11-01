/**
 * Category Extraction Logic
 */

import type { ExtractedCategory } from './types';
import { humanizeName } from './utilities';

export function extractCategories(page: { url: string; title: string; content: string }): ExtractedCategory[] {
  const categories: ExtractedCategory[] = [];

  // ONLY extract from actual site structure - breadcrumbs, categories in content
  // Look for explicit category mentions in the content
  const categoryPattern = /(?:category|categories|filed under|posted in|tagged):\s*([^,\n]+)/gi;
  let match;

  while ((match = categoryPattern.exec(page.content || '')) !== null) {
    const matchedText = match[1];
    if (matchedText) {
      const categoryName = humanizeName(matchedText.trim());
      if (categoryName.length > 2 && categoryName.length < 50) {
        categories.push({ name: categoryName });
      }
    }
  }

  // If the page explicitly has category data in its structure, use it
  // Otherwise, we don't guess or impose categories

  return categories;
}

export function extractBrand(title: string, content: string): string | null {
  // Common brand patterns in titles
  const brandMatch = title.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+/);
  if (brandMatch && brandMatch[1]) {
    return brandMatch[1];
  }

  // Look for "Brand:" or "Manufacturer:" in content
  const brandPattern = /(?:Brand|Manufacturer|Make):\s*([A-Za-z0-9\s]+)/i;
  const contentMatch = content.match(brandPattern);
  if (contentMatch && contentMatch[1]) {
    return contentMatch[1].trim();
  }

  return null;
}

export function extractProductTypes(content: string): ExtractedCategory[] {
  const types: ExtractedCategory[] = [];

  // Look for "Type:" or "Category:" in content
  const typePattern = /(?:Type|Category|Product Type):\s*([A-Za-z0-9\s\-]+)/gi;
  let match;

  while ((match = typePattern.exec(content)) !== null) {
    const type = match[1];
    if (type && type.trim().length > 2 && type.trim().length < 50) {
      types.push({ name: humanizeName(type.trim()) });
    }
  }

  return types;
}
