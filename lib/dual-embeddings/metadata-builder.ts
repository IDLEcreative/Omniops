/**
 * Metadata Builder
 * Creates metadata-only content strings for embedding
 */

export function createMetadataOnlyContent(metadata: any): string {
  const parts: string[] = [];

  if (metadata.ecommerceData?.products?.length > 0) {
    const product = metadata.ecommerceData.products[0];
    if (product.sku) parts.push(`SKU: ${product.sku}`);
    if (product.name) parts.push(`Product: ${product.name}`);
    if (product.price) parts.push(`Price: ${product.price}`);
    if (product.brand) parts.push(`Brand: ${product.brand}`);
    if (product.availability?.inStock !== undefined) {
      parts.push(`Stock: ${product.availability.inStock ? 'Available' : 'Out of Stock'}`);
    }
    if (product.categories?.length > 0) {
      parts.push(`Categories: ${product.categories.join(', ')}`);
    }
  }

  if (metadata.productSku) parts.push(`SKU: ${metadata.productSku}`);
  if (metadata.productPrice) parts.push(`Price: ${metadata.productPrice}`);
  if (metadata.productInStock !== undefined) {
    parts.push(`Stock: ${metadata.productInStock ? 'Available' : 'Out of Stock'}`);
  }

  return parts.join(' | ');
}

export function calculateEmbeddingQuality(metadataContent: string, metadata: any): {
  hasStructuredData: boolean;
  metadataScore: number;
  recommendedWeights: { text: number; metadata: number };
} {
  const hasStructuredData = metadataContent.length > 20;

  let score = 0;
  if (metadata?.ecommerceData?.products?.length && metadata.ecommerceData.products.length > 0) score += 40;
  if (metadata?.productSku || metadata?.ecommerceData?.products?.[0]?.sku) score += 30;
  if (metadata?.productPrice || metadata?.ecommerceData?.products?.[0]?.price) score += 20;
  if (metadata?.productInStock !== undefined) score += 10;

  let textWeight = 0.6;
  let metadataWeight = 0.4;

  if (score >= 70) {
    textWeight = 0.4;
    metadataWeight = 0.6;
  } else if (score >= 40) {
    textWeight = 0.5;
    metadataWeight = 0.5;
  }

  return {
    hasStructuredData,
    metadataScore: score,
    recommendedWeights: { text: textWeight, metadata: metadataWeight }
  };
}
