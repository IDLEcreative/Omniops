import OpenAI from 'openai';
import { createHash } from 'crypto';

// Core interfaces
interface AIMetadata {
  summary: string; // 50-100 words
  briefSummary: string; // 10-15 words
  contentType: ContentType;
  topics: string[];
  keywords: string[];
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    products: string[];
    dates: string[];
  };
  answerableQuestions: Question[];
  sentiment: 'positive' | 'negative' | 'neutral';
  complexity: 'simple' | 'moderate' | 'complex';
  embeddings: {
    summary: number[];
    keywords: number[][];
    cached: boolean;
    model: string;
  };
  intentMappings: IntentMapping[];
  quality: QualityScore;
  generatedAt: string;
  contentHash: string;
}

interface Question {
  question: string;
  answer: string;
  confidence: number;
  source: string; // section of content
  type: 'factual' | 'procedural' | 'conceptual';
}

interface IntentMapping {
  pattern: string; // regex or keyword pattern
  intent: string;
  confidence: number;
  examples: string[];
}

interface QualityScore {
  overall: number;
  summaryAccuracy: number;
  entityAccuracy: number;
  questionQuality: number;
  completeness: number;
}

type ContentType = 
  | 'faq' 
  | 'documentation' 
  | 'product_info' 
  | 'support_article' 
  | 'policy' 
  | 'troubleshooting' 
  | 'general';

interface CacheEntry {
  hash: string;
  metadata: AIMetadata;
  timestamp: number;
  ttl: number;
}

interface ProcessingOptions {
  useCache?: boolean;
  cacheTimeout?: number;
  embeddingModel?: string;
  maxKeywords?: number;
  maxQuestions?: number;
  includeEmbeddings?: boolean;
}

// Main AI Metadata Generator Class
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

    // Generate all metadata components
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
      this.classifyContentType(content),
      this.extractTopics(content),
      this.extractKeywords(content, opts.maxKeywords || 20),
      this.extractEntities(content),
      this.generateQuestions(content, opts.maxQuestions || 10),
      this.analyzeSentiment(content),
      this.assessComplexity(content),
      this.generateIntentMappings(content)
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
    const quality = this.calculateQualityScore(content, {
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
   * Generate extractive summary using key sentence identification
   */
  private async generateSummary(content: string): Promise<string> {
    const sentences = this.splitIntoSentences(content);
    const scores = this.scoreSentences(sentences, content);
    const topSentences = this.selectTopSentences(sentences, scores, 50, 100);
    
    return topSentences.join(' ').trim();
  }

  /**
   * Generate brief summary (10-15 words)
   */
  private async generateBriefSummary(content: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Create a 10-15 word summary of this content:\n\n${content.slice(0, 2000)}`
        }],
        max_tokens: 50,
        temperature: 0.3
      });

      return response.choices[0]?.message?.content?.trim() || 'Content summary unavailable';
    } catch (error) {
      console.error('Error generating brief summary:', error);
      return this.generateFallbackBriefSummary(content);
    }
  }

  /**
   * Extract entities using pattern matching and NLP techniques
   */
  private async extractEntities(content: string): Promise<AIMetadata['entities']> {
    const entities = {
      people: this.extractPeople(content),
      organizations: this.extractOrganizations(content),
      locations: this.extractLocations(content),
      products: this.extractProducts(content),
      dates: this.extractDates(content)
    };

    return entities;
  }

  /**
   * Generate answerable questions from content
   */
  private async generateQuestions(content: string, maxQuestions: number): Promise<Question[]> {
    const questions: Question[] = [];

    // Extract explicit FAQ questions
    const faqQuestions = this.extractFAQQuestions(content);
    questions.push(...faqQuestions);

    // Generate implicit questions using AI
    if (questions.length < maxQuestions) {
      const implicitQuestions = await this.generateImplicitQuestions(content, maxQuestions - questions.length);
      questions.push(...implicitQuestions);
    }

    return questions.slice(0, maxQuestions);
  }

  /**
   * Extract topics using TF-IDF and topic modeling
   */
  private extractTopics(content: string): Promise<string[]> {
    return new Promise((resolve) => {
      const words = this.tokenize(content);
      const tfidf = this.calculateTFIDF(words, [words]);
      const topics = this.extractTopicsFromTFIDF(tfidf);
      resolve(topics);
    });
  }

  /**
   * Extract keywords using TF-IDF
   */
  private extractKeywords(content: string, maxKeywords: number): Promise<string[]> {
    return new Promise((resolve) => {
      const words = this.tokenize(content);
      const tfidf = this.calculateTFIDF(words, [words]);
      const keywords = Object.entries(tfidf)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxKeywords)
        .map(([word]) => word);
      
      resolve(keywords);
    });
  }

  /**
   * Classify content type
   */
  private async classifyContentType(content: string): Promise<ContentType> {
    const indicators = {
      faq: /(?:frequently asked questions|faq|q&a|questions and answers)/i,
      documentation: /(?:documentation|docs|manual|guide|reference)/i,
      product_info: /(?:product|features|specifications|pricing)/i,
      support_article: /(?:support|help|how to|tutorial|troubleshoot)/i,
      policy: /(?:policy|terms|conditions|agreement|legal)/i,
      troubleshooting: /(?:error|issue|problem|fix|solve|troubleshoot)/i
    };

    for (const [type, pattern] of Object.entries(indicators)) {
      if (pattern.test(content)) {
        return type as ContentType;
      }
    }

    return 'general';
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(content: string): Promise<'positive' | 'negative' | 'neutral'> {
    return new Promise((resolve) => {
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'satisfied'];
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'wrong', 'error'];
      
      const words = content.toLowerCase().split(/\W+/);
      const positive = words.filter(word => positiveWords.includes(word)).length;
      const negative = words.filter(word => negativeWords.includes(word)).length;
      
      if (positive > negative) resolve('positive');
      else if (negative > positive) resolve('negative');
      else resolve('neutral');
    });
  }

  /**
   * Assess complexity
   */
  private assessComplexity(content: string): Promise<'simple' | 'moderate' | 'complex'> {
    return new Promise((resolve) => {
      const sentences = this.splitIntoSentences(content);
      const avgWordsPerSentence = sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sentences.length;
      const technicalTerms = content.match(/\b[A-Z]{2,}\b|\b\w+(?:API|SDK|URL|HTTP|JSON|XML)\b/g)?.length || 0;
      
      if (avgWordsPerSentence > 25 || technicalTerms > 10) {
        resolve('complex');
      } else if (avgWordsPerSentence > 15 || technicalTerms > 5) {
        resolve('moderate');
      } else {
        resolve('simple');
      }
    });
  }

  /**
   * Generate intent mappings
   */
  private async generateIntentMappings(content: string): Promise<IntentMapping[]> {
    const mappings: IntentMapping[] = [];
    
    // Common intent patterns
    const intentPatterns = {
      'get_help': { patterns: ['help', 'support', 'assist'], confidence: 0.8 },
      'find_information': { patterns: ['what', 'how', 'where', 'when'], confidence: 0.7 },
      'report_issue': { patterns: ['problem', 'error', 'issue', 'bug'], confidence: 0.9 },
      'request_feature': { patterns: ['want', 'need', 'request', 'feature'], confidence: 0.6 },
      'get_pricing': { patterns: ['price', 'cost', 'pricing', 'fee'], confidence: 0.8 }
    };

    for (const [intent, config] of Object.entries(intentPatterns)) {
      const pattern = config.patterns.join('|');
      const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
      const matches = content.match(regex);
      
      if (matches && matches.length > 0) {
        mappings.push({
          pattern,
          intent,
          confidence: config.confidence,
          examples: matches.slice(0, 3)
        });
      }
    }

    return mappings;
  }

  /**
   * Generate embeddings for summary and keywords
   */
  private async generateEmbeddings(
    summary: string, 
    keywords: string[], 
    model: string
  ): Promise<AIMetadata['embeddings']> {
    try {
      // Generate summary embedding
      const summaryResponse = await this.openai.embeddings.create({
        model,
        input: summary,
      });

      // Generate keyword embeddings
      const keywordResponses = await Promise.all(
        keywords.slice(0, 10).map(keyword => 
          this.openai.embeddings.create({
            model,
            input: keyword,
          })
        )
      );

      return {
        summary: summaryResponse.data[0]?.embedding || [],
        keywords: keywordResponses.map(response => response.data[0]?.embedding || []),
        cached: false,
        model
      };
    } catch (error) {
      console.error('Error generating embeddings:', error);
      return {
        summary: [],
        keywords: [],
        cached: false,
        model
      };
    }
  }

  /**
   * Calculate quality score for generated metadata
   */
  private calculateQualityScore(content: string, metadata: any): QualityScore {
    const summaryAccuracy = this.scoreSummaryAccuracy(content, metadata.summary);
    const entityAccuracy = this.scoreEntityAccuracy(content, metadata.entities);
    const questionQuality = this.scoreQuestionQuality(metadata.questions);
    const completeness = this.scoreCompleteness(metadata);

    const overall = (summaryAccuracy + entityAccuracy + questionQuality + completeness) / 4;

    return {
      overall,
      summaryAccuracy,
      entityAccuracy,
      questionQuality,
      completeness
    };
  }

  // Helper methods
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

  private splitIntoSentences(text: string): string[] {
    return text.match(/[^\.!?]+[\.!?]+/g) || [text];
  }

  private scoreSentences(sentences: string[], fullText: string): number[] {
    return sentences.map(sentence => {
      let score = 0;
      
      // Length factor (prefer medium-length sentences)
      const length = sentence.split(/\s+/).length;
      if (length >= 10 && length <= 25) score += 1;
      
      // Position factor (first and last sentences often important)
      const position = sentences.indexOf(sentence);
      if (position === 0 || position === sentences.length - 1) score += 0.5;
      
      // Keyword density
      const words = sentence.toLowerCase().split(/\W+/);
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
      const contentWords = words.filter(word => !commonWords.includes(word));
      score += contentWords.length / words.length;
      
      return score;
    });
  }

  private selectTopSentences(sentences: string[], scores: number[], minWords: number, maxWords: number): string[] {
    const sentenceScorePairs = sentences.map((sentence, index) => ({
      sentence,
      score: scores[index]
    }));
    
    sentenceScorePairs.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    const selected: string[] = [];
    let wordCount = 0;
    
    for (const pair of sentenceScorePairs) {
      const sentenceWords = pair.sentence.split(/\s+/).length;
      if (wordCount + sentenceWords <= maxWords) {
        selected.push(pair.sentence);
        wordCount += sentenceWords;
        
        if (wordCount >= minWords) break;
      }
    }
    
    return selected;
  }

  private generateFallbackBriefSummary(content: string): string {
    const words = content.split(/\s+/).slice(0, 15);
    return words.join(' ') + (content.split(/\s+/).length > 15 ? '...' : '');
  }

  private extractPeople(content: string): string[] {
    // Simple pattern matching for names (can be enhanced with NLP libraries)
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const matches = content.match(namePattern) || [];
    return [...new Set(matches)];
  }

  private extractOrganizations(content: string): string[] {
    const orgPattern = /\b(?:[A-Z][a-z]+ )*(?:Inc|Corp|LLC|Ltd|Company|Organization|University|College|Institute)\b/g;
    const matches = content.match(orgPattern) || [];
    return [...new Set(matches)];
  }

  private extractLocations(content: string): string[] {
    const locationPattern = /\b[A-Z][a-z]+(?:, [A-Z][a-z]+)*\b/g;
    const matches = content.match(locationPattern) || [];
    return [...new Set(matches)].filter(loc => loc.length > 3);
  }

  private extractProducts(content: string): string[] {
    // Enhanced product detection patterns
    const productPatterns = [
      /\b[A-Z][a-zA-Z]+ \d+(?:\.\d+)*\b/, // Product v1.0
      /\b[A-Z][a-zA-Z]*(?:-[A-Z][a-zA-Z]*)*\b/, // Product-Name
      /\b(?:API|SDK|Service|Platform|Tool|App|Software)\b/gi
    ];
    
    const products = new Set<string>();
    productPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => products.add(match));
    });
    
    return Array.from(products);
  }

  private extractDates(content: string): string[] {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY
      /\b\d{4}-\d{2}-\d{2}\b/g, // YYYY-MM-DD
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}\b/gi
    ];
    
    const dates = new Set<string>();
    datePatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => dates.add(match));
    });
    
    return Array.from(dates);
  }

  private extractFAQQuestions(content: string): Question[] {
    const questions: Question[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      if (line.match(/^(?:Q:|Question:|FAQ:|\d+\.)\s*(.+\?)\s*$/)) {
        const question = line.replace(/^(?:Q:|Question:|FAQ:|\d+\.)\s*/, '').trim();
        const answerLines: string[] = [];
        
        // Look for answer in next few lines
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j]?.trim() || '';
          if (nextLine.match(/^(?:A:|Answer:|\d+\.)/)) {
            answerLines.push(nextLine.replace(/^(?:A:|Answer:|\d+\.)\s*/, ''));
          } else if (nextLine.length > 0 && !nextLine.match(/^(?:Q:|Question:|FAQ:)/)) {
            answerLines.push(nextLine);
          } else {
            break;
          }
        }
        
        if (answerLines.length > 0) {
          questions.push({
            question,
            answer: answerLines.join(' ').trim(),
            confidence: 0.9,
            source: `FAQ section (line ${i + 1})`,
            type: 'factual'
          });
        }
      }
    }
    
    return questions;
  }

  private async generateImplicitQuestions(content: string, maxQuestions: number): Promise<Question[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Generate ${maxQuestions} relevant questions that can be answered from this content. For each question, provide the answer and indicate if it's factual, procedural, or conceptual:\n\n${content.slice(0, 3000)}`
        }],
        max_tokens: 1000,
        temperature: 0.3
      });

      const result = response.choices[0]?.message?.content || '';
      return this.parseGeneratedQuestions(result, content);
    } catch (error) {
      console.error('Error generating implicit questions:', error);
      return [];
    }
  }

  private parseGeneratedQuestions(generatedText: string, sourceContent: string): Question[] {
    const questions: Question[] = [];
    const lines = generatedText.split('\n').filter(line => line.trim());
    
    let currentQuestion = '';
    let currentAnswer = '';
    let currentType: Question['type'] = 'factual';
    
    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        if (currentQuestion && currentAnswer) {
          questions.push({
            question: currentQuestion,
            answer: currentAnswer,
            confidence: 0.7,
            source: 'Generated from content analysis',
            type: currentType
          });
        }
        
        currentQuestion = line.replace(/^\d+\.\s*/, '').trim();
        currentAnswer = '';
        currentType = 'factual';
      } else if (line.toLowerCase().startsWith('answer:')) {
        currentAnswer = line.replace(/^answer:\s*/i, '').trim();
      } else if (line.toLowerCase().includes('procedural')) {
        currentType = 'procedural';
      } else if (line.toLowerCase().includes('conceptual')) {
        currentType = 'conceptual';
      }
    }
    
    // Add last question
    if (currentQuestion && currentAnswer) {
      questions.push({
        question: currentQuestion,
        answer: currentAnswer,
        confidence: 0.7,
        source: 'Generated from content analysis',
        type: currentType
      });
    }
    
    return questions;
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'who', 'oil', 'sit', 'ago', 'big', 'cry', 'far', 'fun', 'let', 'own', 'say', 'too', 'try'].includes(word));
  }

  private calculateTFIDF(words: string[], documents: string[][]): Record<string, number> {
    const tfidf: Record<string, number> = {};
    const docCount = documents.length;
    const wordCounts = this.getWordCounts(words);
    const totalWords = words.length;
    
    for (const [word, count] of Object.entries(wordCounts)) {
      // Term frequency
      const tf = count / totalWords;
      
      // Document frequency
      const df = documents.filter(doc => doc.includes(word)).length;
      
      // Inverse document frequency
      const idf = Math.log(docCount / (df || 1));
      
      tfidf[word] = tf * idf;
    }
    
    return tfidf;
  }

  private getWordCounts(words: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    words.forEach(word => {
      counts[word] = (counts[word] || 0) + 1;
    });
    return counts;
  }

  private extractTopicsFromTFIDF(tfidf: Record<string, number>): string[] {
    return Object.entries(tfidf)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private scoreSummaryAccuracy(content: string, summary: string): number {
    const contentWords = new Set(this.tokenize(content));
    const summaryWords = new Set(this.tokenize(summary));
    
    const intersection = new Set([...summaryWords].filter(word => contentWords.has(word)));
    const accuracy = intersection.size / summaryWords.size;
    
    return Math.min(accuracy * 1.2, 1.0); // Boost score slightly, cap at 1.0
  }

  private scoreEntityAccuracy(content: string, entities: AIMetadata['entities']): number {
    let totalEntities = 0;
    let accurateEntities = 0;
    
    Object.values(entities).forEach(entityList => {
      entityList.forEach(entity => {
        totalEntities++;
        if (content.includes(entity)) {
          accurateEntities++;
        }
      });
    });
    
    return totalEntities > 0 ? accurateEntities / totalEntities : 1.0;
  }

  private scoreQuestionQuality(questions: Question[]): number {
    if (questions.length === 0) return 0.5;
    
    const avgConfidence = questions.reduce((sum, q) => sum + q.confidence, 0) / questions.length;
    const hasVariedTypes = new Set(questions.map(q => q.type)).size > 1;
    const hasGoodAnswers = questions.every(q => q.answer.length > 10);
    
    let score = avgConfidence * 0.6;
    if (hasVariedTypes) score += 0.2;
    if (hasGoodAnswers) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private scoreCompleteness(metadata: any): number {
    let score = 0;
    const components = [
      metadata.summary,
      metadata.topics?.length > 0,
      metadata.keywords?.length > 0,
      Object.values(metadata.entities).some((arr: any) => arr.length > 0),
      metadata.questions?.length > 0
    ];
    
    components.forEach(component => {
      if (component) score += 0.2;
    });
    
    return score;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Usage Examples
export class MetadataExamples {
  static async basicUsage() {
    const generator = new AIMetadataGenerator('your-openai-api-key');
    
    const content = `
    Our customer service platform provides 24/7 support through multiple channels.
    Customers can reach us via email, phone, or live chat. We guarantee response 
    times of under 2 hours for all inquiries. Our team is trained to handle 
    technical issues, billing questions, and general product information.
    
    FAQ:
    Q: What are your support hours?
    A: We provide 24/7 support through all channels.
    
    Q: How quickly do you respond?
    A: We guarantee responses within 2 hours.
    `;

    const metadata = await generator.generateMetadata(content, {
      maxKeywords: 15,
      maxQuestions: 5,
      includeEmbeddings: true
    });

    console.log('Generated Metadata:', {
      summary: metadata.summary,
      briefSummary: metadata.briefSummary,
      contentType: metadata.contentType,
      topics: metadata.topics,
      sentiment: metadata.sentiment,
      questionsCount: metadata.answerableQuestions.length,
      qualityScore: metadata.quality.overall
    });

    return metadata;
  }

  static async batchProcessing() {
    const generator = new AIMetadataGenerator('your-openai-api-key');
    
    const documents = [
      'Product documentation content...',
      'FAQ content...',
      'Support article content...'
    ];

    const results = await Promise.all(
      documents.map(content => generator.generateMetadata(content))
    );

    console.log(`Processed ${results.length} documents`);
    return results;
  }

  static async searchOptimization() {
    const generator = new AIMetadataGenerator('your-openai-api-key');
    
    const content = 'Your content here...';
    const metadata = await generator.generateMetadata(content);

    // Use embeddings for similarity search
    const queryEmbedding = await generator['generateEmbeddings']('user query', [], 'text-embedding-3-small');
    
    // Calculate similarity (cosine similarity)
    const similarity = calculateCosineSimilarity(
      metadata.embeddings.summary,
      queryEmbedding.summary
    );

    console.log('Content similarity to query:', similarity);
    return { metadata, similarity };
  }
}

// Utility function for cosine similarity
function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += (a[i] || 0) * (b[i] || 0);
    normA += (a[i] || 0) * (a[i] || 0);
    normB += (b[i] || 0) * (b[i] || 0);
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default AIMetadataGenerator;