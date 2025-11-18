/**
 * Utility functions for Enhanced Embeddings
 * Includes context statistics and product page enhancement
 */

import type { ChunkResult, ContextStats, SearchResult } from './enhanced-embeddings-types';

// Re-export search functions from enhanced-embeddings-search.ts
export { searchKeywordsInContent, searchTitleAndUrl } from './enhanced-embeddings-search';

/**
 * Get statistics about the context window usage
 */
export function getContextStats(chunks: ChunkResult[]): ContextStats {
  const totalTokens = chunks.reduce((sum, c) =>
    sum + Math.ceil((c.content?.length || 0) / 4), 0
  );

  const avgSimilarity = chunks.reduce((sum, c) =>
    sum + (c.similarity || 0), 0
  ) / chunks.length;

  const highQuality = chunks.filter(c => c.similarity > 0.8).length;

  const uniquePages = new Set(chunks.map(c => c.page_id || c.url)).size;

  return {
    totalChunks: chunks.length,
    totalTokens,
    averageSimilarity: avgSimilarity,
    highQualityChunks: highQuality,
    pagesRepresented: uniquePages
  };
}

/**
 * Enhance item pages by retrieving ALL chunks for complete item information
 */
export async function enhanceProductPages(
  results: Array<{ content: string; url: string; title: string; similarity: number }>,
  supabase: any
): Promise<Array<{ content: string; url: string; title: string; similarity: number }>> {
  const mapped = [...results];
  const productUrls = mapped
    .filter(r => r.url.includes('/product/'))
    .map(r => r.url);

  if (productUrls.length === 0) return mapped;


  // For each product URL, get ALL its chunks
  for (const productUrl of productUrls) {
    try {
      // First, get the page_id for this URL
      const { data: pageData } = await supabase
        .from('scraped_pages')
        .select('id')
        .eq('url', productUrl)
        .single();

      if (pageData?.id) {
        // Get ALL chunks for this page
        const { data: allChunks } = await supabase
          .from('page_embeddings')
          .select('chunk_text, metadata')
          .eq('page_id', pageData.id);

        if (allChunks && allChunks.length > 0) {

          // Intelligently combine chunks - prioritize chunks with product details
          let combinedContent = '';
          let productDescChunk = '';
          let specsChunk = '';
          let priceChunk = '';

          // Categorize chunks by content type
          allChunks.forEach((chunk: any) => {
            const text = chunk.chunk_text;

            // Check what type of content this chunk contains
            if (text.includes('SKU:') && text.includes('Product Description')) {
              // This chunk has the complete item info
              productDescChunk = text + '\n';
            } else if (text.includes('Product Description') || text.includes('SKU:') || text.includes('Item Number')) {
              productDescChunk += text + '\n';
            } else if (text.includes('Specification') || text.includes('Dimensions') || text.includes('Capacity')) {
              specsChunk += text + '\n';
            } else if (text.includes('Price') || text.includes('Cost') || (text.match(/[\$£€]\d+/))) {
              priceChunk += text + '\n';
            }
          });

          // Combine in order of importance
          if (productDescChunk) combinedContent += productDescChunk;
          if (specsChunk && !productDescChunk.includes(specsChunk)) {
            combinedContent += '\n' + specsChunk;
          }
          if (priceChunk && !combinedContent.includes(priceChunk)) {
            combinedContent += '\n' + priceChunk;
          }

          // Find and update the existing result with combined content
          const existingIndex = mapped.findIndex(r => r.url === productUrl);
          if (existingIndex >= 0 && mapped[existingIndex]) {
            mapped[existingIndex].content = combinedContent;

            // Log summary of combined content
          }
        }
      }
    } catch (error) {
      console.error(`[Enhanced Embeddings] Error enhancing item ${productUrl}:`, error);
      // Continue with other items if one fails
    }
  }

  return mapped;
}
