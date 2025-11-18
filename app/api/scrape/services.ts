import OpenAI from 'openai';
import crypto from 'crypto';

// Lazy load OpenAI client to avoid build-time errors
let openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({
      apiKey,
      timeout: 20 * 1000,    // 20 seconds (embeddings need 1-5s normally)
      maxRetries: 2,          // Retry failed requests twice
    });
  }
  return openai;
}

// Cache for deduplication within a single request
const chunkHashCache = new Map<string, boolean>();

/**
 * Generate hash for chunk deduplication
 */
export function generateChunkHash(text: string): string {
  // Normalize text for consistent hashing
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();

  return crypto.createHash('sha256')
    .update(normalized)
    .digest('hex');
}

/**
 * Split text into chunks with deduplication
 */
export function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  const sentences = text.split(/[.!?]+/);
  const chunks: string[] = [];
  let currentChunk = '';
  let duplicatesSkipped = 0;

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      const trimmedChunk = currentChunk.trim();
      const chunkHash = generateChunkHash(trimmedChunk);

      // Only add unique chunks
      if (!chunkHashCache.has(chunkHash)) {
        chunks.push(trimmedChunk);
        chunkHashCache.set(chunkHash, true);
      } else {
        duplicatesSkipped++;
      }

      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) {
    const trimmedChunk = currentChunk.trim();
    const chunkHash = generateChunkHash(trimmedChunk);

    if (!chunkHashCache.has(chunkHash)) {
      chunks.push(trimmedChunk);
      chunkHashCache.set(chunkHash, true);
    } else {
      duplicatesSkipped++;
    }
  }

  if (duplicatesSkipped > 0) {
  }

  return chunks;
}

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(chunks: string[]) {
  const embeddings = [];

  // Process in batches to avoid rate limits
  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const response = await getOpenAIClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });

    embeddings.push(...response.data.map(d => d.embedding));
  }

  return embeddings;
}

/**
 * Clear chunk hash cache
 */
export function clearChunkCache(): void {
  chunkHashCache.clear();
}

/**
 * Enrich content with metadata for better search
 */
export function enrichContent(content: string, metadata: any): string {
  let enrichedContent = content;

  // Add product category if available
  if (metadata?.productCategory) {
    enrichedContent = `Category: ${metadata.productCategory}\n\n${enrichedContent}`;
  }

  // Add breadcrumbs from ecommerceData if available
  if (metadata?.ecommerceData?.breadcrumbs &&
      Array.isArray(metadata.ecommerceData.breadcrumbs) &&
      metadata.ecommerceData.breadcrumbs.length > 0) {
    const breadcrumbText = metadata.ecommerceData.breadcrumbs.map((b: any) => b.name).join(' > ');
    enrichedContent = `${breadcrumbText}\n\n${enrichedContent}`;
  }

  // Add brand if available
  if (metadata?.productBrand) {
    enrichedContent = `Brand: ${metadata.productBrand}\n${enrichedContent}`;
  }

  return enrichedContent;
}
