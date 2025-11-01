/**
 * OpenAI embeddings functionality check
 */

import { generateQueryEmbedding } from '@/lib/embeddings';
import type { VerificationResult } from '../types';

export async function checkOpenAIEmbeddings(domain?: string): Promise<VerificationResult> {
  const startTime = Date.now();

  try {
    const testEmbedding = await generateQueryEmbedding('test verification query', true, domain);

    if (testEmbedding && testEmbedding.length === 1536) {
      return {
        check: 'OpenAI Embeddings',
        status: 'pass',
        message: 'Embedding generation working (1536-dimensional vectors)',
        duration: Date.now() - startTime,
        details: {
          vectorSize: testEmbedding.length,
          model: 'text-embedding-3-small',
        },
      };
    }

    return {
      check: 'OpenAI Embeddings',
      status: 'fail',
      message: `Invalid embedding size: ${testEmbedding?.length || 0}`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isApiKeyError =
      errorMessage.toLowerCase().includes('api key') ||
      errorMessage.toLowerCase().includes('openai');

    return {
      check: 'OpenAI Embeddings',
      status: 'fail',
      message: isApiKeyError
        ? 'OpenAI API key not configured or invalid'
        : `Embedding generation failed: ${errorMessage}`,
      duration: Date.now() - startTime,
    };
  }
}
