/**
 * Demo Scraper - Embeddings Generation Module
 * Handles OpenAI embeddings for demo content
 */

import OpenAI from 'openai';
import type { ScrapedPage, ChunkMetadata, DemoEmbeddingsResult } from './types';

/**
 * Generates embeddings for demo content (in-memory only)
 */
export async function generateDemoEmbeddings(pages: ScrapedPage[]): Promise<DemoEmbeddingsResult> {
  // Validate OpenAI API key first
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const chunks: string[] = [];
  const chunkMetadata: ChunkMetadata[] = [];

  // Chunk each page's content
  for (const page of pages) {
    const pageChunks = chunkText(page.content, 500); // 500 char chunks
    pageChunks.forEach((chunk, index) => {
      chunks.push(chunk);
      chunkMetadata.push({
        url: page.url,
        title: page.title,
        chunkIndex: index
      });
    });
  }

  try {
    // Generate embeddings using OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunks
    });

    const embeddings = response.data.map((item: { embedding: number[] }) => item.embedding);

    return {
      chunks,
      embeddings,
      metadata: chunkMetadata
    };
  } catch (error) {
    console.error('OpenAI embeddings generation failed:', error);
    // Re-throw with more context for better error handling upstream
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Chunks text into smaller pieces for embeddings
 */
function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const words = text.split(' ');
  let currentChunk = '';

  for (const word of words) {
    if (currentChunk.length + word.length + 1 > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = word;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
