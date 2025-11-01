/**
 * Product Page Detection
 */

export function isLikelyProductPage(url: string, content: string): boolean {
  // URL indicators
  if (url.includes('/product/') || url.includes('/item/')) return true;

  // Content indicators
  const indicators = ['price', 'add to cart', 'sku', 'product code', 'availability'];
  const lowerContent = content.toLowerCase();

  let matches = 0;
  for (const indicator of indicators) {
    if (lowerContent.includes(indicator)) matches++;
  }

  return matches >= 2;
}
