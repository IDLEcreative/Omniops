export function buildProductResults(count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    content: `Product ${i + 1}`,
    url: `https://example.com/product-${i + 1}`,
    title: `Product ${i + 1}`,
    similarity: 0.9 - i * 0.05,
  }));
}
