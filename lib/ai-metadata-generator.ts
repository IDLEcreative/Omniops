/**
 * AI Metadata Generator - Main Orchestrator
 *
 * Refactored main class for generating comprehensive metadata from content.
 * Uses modular strategies, validators, and AI prompts.
 */

import OpenAI from 'openai';
import { MetadataCache } from './ai-metadata-cache';

// Import types
import type {
  AIMetadata,
  Question,
  ProcessingOptions
} from './ai-metadata-generator-types';

// Import strategies
import {
  generateExtractiveSummary,
  generateFallbackBriefSummary,
  extractEntities,
  extractFAQQuestions,
  classifyContentType,
  analyzeSentiment,
  assessComplexity,
  generateIntentMappings,
  extractTopics,
  extractKeywords
} from './ai-metadata-generator-strategies';

// Import prompts
import {
  generateBriefSummaryWithAI,
  generateImplicitQuestionsWithAI,
  generateEmbeddingsWithAI
} from './ai-metadata-generator-prompts';

// Import validators
import {
  calculateQualityScore
} from './ai-metadata-generator-validators';

/**
 * Main AI Metadata Generator Class
 */
export class AIMetadataGenerator {
  private openai: OpenAI;
  private cache: MetadataCache;
  private embeddingModel: string;

  constructor(openaiApiKey: string, embeddingModel: string = 'text-embedding-3-small') {
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
      timeout: 25 * 1000,    // 25 seconds (mixed operations - chat + embeddings)
      maxRetries: 2,          // Retry failed requests twice
    });
    this.cache = new MetadataCache();
    this.embeddingModel = embeddingModel;
  }

  /**
   * Generate comprehensive metadata for content
   */
  async generateMetadata(
    content: string,
    options: ProcessingOptions = {}
  ): Promise<AIMetadata> {
    const defaults: ProcessingOptions = {
      useCache: true,
      cacheTimeout: 3600000, // 1 hour
      embeddingModel: this.embeddingModel,
      maxKeywords: 20,
      maxQuestions: 10,
      includeEmbeddings: true,
    };

    const opts = { ...defaults, ...options };
    const contentHash = this.cache.generateContentHash(content);

    // Check cache first
    if (opts.useCache && this.cache.isCached(contentHash)) {
      const cached = this.cache.getFromCache(contentHash);
      if (cached) return cached;
    }

    console.log('Generating new metadata for content...');

    // Generate all metadata components in parallel
    const [
      summary,
      briefSummary,
      contentType,
      topics,
      keywords,
      entities,
      questions,
      sentiment,
      complexity,
      intentMappings
    ] = await Promise.all([
      this.generateSummary(content),
      this.generateBriefSummary(content),
      this.classifyContent(content),
      this.getTopics(content),
      this.getKeywords(content, opts.maxKeywords || 20),
      this.getEntities(content),
      this.generateQuestions(content, opts.maxQuestions || 10),
      this.getSentiment(content),
      this.getComplexity(content),
      this.getIntentMappings(content)
    ]);

    // Generate embeddings
    let embeddings = {
      summary: [] as number[],
      keywords: [] as number[][],
      cached: false,
      model: opts.embeddingModel || this.embeddingModel
    };

    if (opts.includeEmbeddings) {
      embeddings = await this.generateEmbeddings(summary, keywords, opts.embeddingModel || this.embeddingModel);
    }

    // Calculate quality scores
    const quality = calculateQualityScore(content, {
      summary,
      entities,
      questions,
      keywords,
      topics
    });

    const metadata: AIMetadata = {
      summary,
      briefSummary,
      contentType,
      topics,
      keywords,
      entities,
      answerableQuestions: questions,
      sentiment,
      complexity,
      embeddings,
      intentMappings,
      quality,
      generatedAt: new Date().toISOString(),
      contentHash
    };

    // Cache the result
    if (opts.useCache) {
      this.cache.cacheMetadata(contentHash, metadata, opts.cacheTimeout || 3600000);
    }

    return metadata;
  }

  /**
   * Generate extractive summary
   */
  private async generateSummary(content: string): Promise<string> {
    return generateExtractiveSummary(content);
  }

  /**
   * Generate brief summary using AI
   */
  private async generateBriefSummary(content: string): Promise<string> {
    try {
      return await generateBriefSummaryWithAI(this.openai, content);
    } catch (error) {
      return generateFallbackBriefSummary(content);
    }
  }

  /**
   * Classify content type
   */
  private async classifyContent(content: string) {
    return classifyContentType(content);
  }

  /**
   * Extract topics
   */
  private getTopics(content: string): Promise<string[]> {
    return Promise.resolve(extractTopics(content));
  }

  /**
   * Extract keywords
   */
  private getKeywords(content: string, maxKeywords: number): Promise<string[]> {
    return Promise.resolve(extractKeywords(content, maxKeywords));
  }

  /**
   * Extract entities
   */
  private async getEntities(content: string) {
    return extractEntities(content);
  }

  /**
   * Generate questions
   */
  private async generateQuestions(content: string, maxQuestions: number): Promise<Question[]> {
    const questions: Question[] = [];

    // Extract explicit FAQ questions
    const faqQuestions = extractFAQQuestions(content);
    questions.push(...faqQuestions);

    // Generate implicit questions using AI
    if (questions.length < maxQuestions) {
      const implicitQuestions = await generateImplicitQuestionsWithAI(
        this.openai,
        content,
        maxQuestions - questions.length
      );
      questions.push(...implicitQuestions);
    }

    return questions.slice(0, maxQuestions);
  }

  /**
   * Analyze sentiment
   */
  private getSentiment(content: string) {
    return Promise.resolve(analyzeSentiment(content));
  }

  /**
   * Assess complexity
   */
  private getComplexity(content: string) {
    return Promise.resolve(assessComplexity(content));
  }

  /**
   * Generate intent mappings
   */
  private async getIntentMappings(content: string) {
    return generateIntentMappings(content);
  }

  /**
   * Generate embeddings
   */
  private async generateEmbeddings(
    summary: string,
    keywords: string[],
    model: string
  ) {
    return generateEmbeddingsWithAI(this.openai, summary, keywords, model);
  }

  /**
   * Public cache operations
   */
  public clearCache(): void {
    this.cache.clearCache();
  }

  public getCacheStats(): { size: number; entries: string[] } {
    return this.cache.getCacheStats();
  }
}

// Re-export MetadataExamples for backwards compatibility
export { MetadataExamples } from './ai-metadata-generator-examples';

// Re-export all types for backwards compatibility
export type {
  AIMetadata,
  Question,
  IntentMapping,
  QualityScore,
  ContentType,
  CacheEntry,
  ProcessingOptions
} from './ai-metadata-generator-types';

// Re-export utility functions
export { calculateCosineSimilarity } from './ai-metadata-generator-validators';

// Default export
export default AIMetadataGenerator;
