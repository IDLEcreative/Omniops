/**
 * Category Mapper Utilities
 */

export function humanizeName(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

export function generatePattern(category: string, urls: string[]): string {
  // Find common URL patterns
  const commonSegments = new Set<string>();

  for (const url of urls) {
    const segments = url.split('/').filter(s => s);
    for (const segment of segments) {
      if (segment.toLowerCase().includes(category.toLowerCase().replace(/\s+/g, '-'))) {
        commonSegments.add(segment);
      }
    }
  }

  return Array.from(commonSegments).join('|') || category.toLowerCase();
}

export function calculateConfidence(categorySize: number, totalProducts: number): number {
  // Higher confidence for categories with more products
  const sizeScore = Math.min(categorySize / 10, 1) * 0.5;

  // Higher confidence for better coverage
  const coverageScore = Math.min(categorySize / totalProducts * 10, 1) * 0.5;

  return sizeScore + coverageScore;
}
