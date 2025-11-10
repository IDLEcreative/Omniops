/**
 * Embedding Generation Utilities
 * @module lib/scraper/utils/embeddings
 */

/**
 * Helper function to generate embeddings with optimized batching
 */
export async function generateEmbeddings(chunks, openai, jobId = '') {
  console.log(`[Worker ${jobId}] Generating embeddings for ${chunks.length} chunks via OpenAI API`);

  const embeddings = [];
  // Increased batch size for better API efficiency (OpenAI supports up to 2048)
  const batchSize = 50; // Increased from 20 to 50 for better throughput

  // Process chunks in larger batches
  const promises = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    // Add small delay between batches to avoid rate limiting
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const promise = openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    }).then(response => response.data.map(d => d.embedding));

    promises.push(promise);

    // Process up to 3 requests in parallel for better throughput
    if (promises.length >= 3 || i + batchSize >= chunks.length) {
      const results = await Promise.all(promises);
      results.forEach(result => embeddings.push(...result));
      promises.length = 0;
    }
  }

  return embeddings;
}
