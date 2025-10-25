/**
 * AI Metadata Generator - Main Orchestrator
 *
 * Refactored main class for generating comprehensive metadata from content.
 * Uses modular strategies, validators, and AI prompts.
 */

import OpenAI from 'openai';
import { createHash } from 'crypto';

// Import types
import type {
  AIMetadata,
  Question,
  IntentMapping,
  QualityScore,
  ContentType,
  CacheEntry,
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
  calculateQualityScore,
  calculateCosineSimilarity
} from './ai-metadata-generator-validators';

/**
 * Main AI Metadata Generator Class
 */
export class AIMetadataGenerator {
  private openai: OpenAI;
  private cache: Map<string, CacheEntry>;
  private embeddingModel: string;

  constructor(openaiApiKey: string, embeddingModel: string = 'text-embedding-3-small') {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.cache = new Map();
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
    const contentHash = this.generateContentHash(content);

    // Check cache first
    if (opts.useCache && this.isCached(contentHash)) {
      const cached = this.getFromCache(contentHash);
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
      this.cacheMetadata(contentHash, metadata, opts.cacheTimeout || 3600000);
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
  private async classifyContent(content: string): Promise<ContentType> {
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
  private async getEntities(content: string): Promise<AIMetadata['entities']> {
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
  private getSentiment(content: string): Promise<'positive' | 'negative' | 'neutral'> {
    return Promise.resolve(analyzeSentiment(content));
  }

  /**
   * Assess complexity
   */
  private getComplexity(content: string): Promise<'simple' | 'moderate' | 'complex'> {
    return Promise.resolve(assessComplexity(content));
  }

  /**
   * Generate intent mappings
   */
  private async getIntentMappings(content: string): Promise<IntentMapping[]> {
    return generateIntentMappings(content);
  }

  /**
   * Generate embeddings
   */
  private async generateEmbeddings(
    summary: string,
    keywords: string[],
    model: string
  ): Promise<AIMetadata['embeddings']> {
    return generateEmbeddingsWithAI(this.openai, summary, keywords, model);
  }

  /**
   * Cache management
   */
  private generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private isCached(hash: string): boolean {
    const entry = this.cache.get(hash);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(hash);
      return false;
    }

    return true;
  }

  private getFromCache(hash: string): AIMetadata | null {
    const entry = this.cache.get(hash);
    return entry ? entry.metadata : null;
  }

  private cacheMetadata(hash: string, metadata: AIMetadata, ttl: number): void {
    this.cache.set(hash, {
      hash,
      metadata,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Public cache operations
   */
  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
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
