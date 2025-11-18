import { AIContentExtractor } from '../../../lib/ai-content-extractor';
import { ContentDeduplicator } from '../../../lib/content-deduplicator';
import { AIMetadataGenerator } from '../../../lib/ai-metadata-generator';
import type { OptimizationResult, MigrationConfig } from './types';

export class PageOptimizer {
  private aiExtractor: AIContentExtractor;
  private deduplicator: ContentDeduplicator;
  private metadataGenerator: AIMetadataGenerator;
  private config: MigrationConfig;

  constructor(
    config: MigrationConfig,
    aiExtractor: AIContentExtractor,
    deduplicator: ContentDeduplicator,
    metadataGenerator: AIMetadataGenerator
  ) {
    this.config = config;
    this.aiExtractor = aiExtractor;
    this.deduplicator = deduplicator;
    this.metadataGenerator = metadataGenerator;
  }

  async optimizePage(page: any): Promise<OptimizationResult> {
    const startTime = Date.now();
    const result: OptimizationResult = {
      url: page.url,
      success: false,
      originalTokens: 0,
      optimizedTokens: 0,
      reductionPercent: 0,
      semanticChunks: 0,
      metadataGenerated: false,
      deduplicationApplied: false,
      processingTime: 0
    };

    try {
      const originalContent = page.content || page.text_content || '';
      result.originalTokens = this.estimateTokens(originalContent);

      let optimizedContent: any;

      switch (this.config.optimizationLevel) {
        case 'advanced':
          optimizedContent = await this.optimizeAdvanced(page, originalContent);
          result.metadataGenerated = true;
          result.deduplicationApplied = true;
          break;

        case 'standard':
          optimizedContent = await this.optimizeStandard(page, originalContent);
          result.metadataGenerated = true;
          break;

        case 'basic':
        default:
          optimizedContent = await AIContentExtractor.extractOptimized(page.html || originalContent, page.url);
          break;
      }

      result.optimizedTokens = this.estimateTokens(optimizedContent.content);
      result.reductionPercent = ((result.originalTokens - result.optimizedTokens) / result.originalTokens) * 100;
      result.semanticChunks = optimizedContent.semanticChunks?.length || 0;
      result.success = true;
      result.processingTime = Date.now() - startTime;

      return result;
    } catch (error: any) {
      result.error = error.message;
      result.processingTime = Date.now() - startTime;
      console.error(`❌ Failed to optimize ${page.url}:`, error.message);
      return result;
    }
  }

  private async optimizeAdvanced(page: any, originalContent: string): Promise<any> {
    const optimizedContent = await AIContentExtractor.extractOptimized(page.html || originalContent, page.url);
    const dedupResult = await this.deduplicator.processContent(optimizedContent.content, page.url);

    const metadata = await this.metadataGenerator.generateMetadata(
      optimizedContent.content,
      { includeEmbeddings: true, maxQuestions: 10 }
    );

    return { ...optimizedContent, deduplication: dedupResult, aiMetadata: metadata };
  }

  private async optimizeStandard(page: any, originalContent: string): Promise<any> {
    const optimizedContent = await AIContentExtractor.extractOptimized(page.html || originalContent, page.url);
    const basicMetadata = await this.metadataGenerator.generateMetadata(
      optimizedContent.content,
      { includeEmbeddings: false, maxQuestions: 0 }
    );
    return { ...optimizedContent, aiMetadata: basicMetadata };
  }

  private estimateTokens(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.round(words * 0.75);
  }
}
