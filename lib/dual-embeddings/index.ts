/**
 * Dual Embeddings - Main Export
 * Provides backward-compatible exports from modular structure
 */

import OpenAI from 'openai';
import * as IntentDetection from './intent-detection';
import * as MetadataBuilder from './metadata-builder';
import * as EmbeddingCore from './embedding-core';

export type { DualEmbeddingResult, QueryIntent } from './types';
export { detectQueryIntent, enrichQueryByIntent, createMetadataQuery, calculateOptimalWeights } from './intent-detection';
export { createMetadataOnlyContent, calculateEmbeddingQuality } from './metadata-builder';
export { generateSingleEmbedding, storeDualEmbeddings } from './embedding-core';

export class DualEmbeddings {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateDualEmbeddings(text: string, metadata: any) {
    const enrichedText = text;
    const metadataContent = metadata ? MetadataBuilder.createMetadataOnlyContent(metadata) : '';
    const hasStructuredData = metadataContent.length > 20;

    const [textEmbedding, metadataEmbedding] = await Promise.all([
      EmbeddingCore.generateSingleEmbedding(this.openai, enrichedText),
      hasStructuredData ? EmbeddingCore.generateSingleEmbedding(this.openai, metadataContent) : Promise.resolve(new Array(1536).fill(0))
    ]);

    const quality = MetadataBuilder.calculateEmbeddingQuality(metadataContent, metadata);

    return { textEmbedding, metadataEmbedding, quality };
  }

  async generateQueryDualEmbeddings(query: string) {
    const intent = IntentDetection.detectQueryIntent(query);
    const enrichedQuery = IntentDetection.enrichQueryByIntent(query, intent);
    const metadataQuery = IntentDetection.createMetadataQuery(query, intent);

    const [textEmbedding, metadataEmbedding] = await Promise.all([
      EmbeddingCore.generateSingleEmbedding(this.openai, enrichedQuery),
      EmbeddingCore.generateSingleEmbedding(this.openai, metadataQuery)
    ]);

    const suggestedWeights = IntentDetection.calculateOptimalWeights(intent);

    return { textEmbedding, metadataEmbedding, intent, suggestedWeights };
  }

  async storeDualEmbeddings(pageId: string, chunks: string[], embeddings: any[], metadata: any) {
    return EmbeddingCore.storeDualEmbeddings(pageId, chunks, embeddings, metadata);
  }
}
