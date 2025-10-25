import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { ExtractedContent } from './content-extractor';
import { SemanticChunk } from './ai-content-extractor-types';

/**
 * Extraction strategies for different content types
 * Handles semantic chunking of web content by category (FAQ, features, specs, etc.)
 */
export class ContentExtractionStrategies {
  /**
   * Extract semantic chunks from the content
   */
  static extractSemanticChunks($: cheerio.CheerioAPI, baseContent: ExtractedContent): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];

    // Extract FAQ sections
    this.extractFAQChunks($, chunks);

    // Extract feature sections
    this.extractFeatureChunks($, chunks);

    // Extract specification sections
    this.extractSpecChunks($, chunks);

    // Extract support/help sections
    this.extractSupportChunks($, chunks);

    // Extract legal sections
    this.extractLegalChunks($, chunks);

    // Extract main content chunks
    this.extractMainContentChunks($, chunks, baseContent);

    return chunks;
  }

  /**
   * Extract FAQ-related chunks
   */
  static extractFAQChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[]): void {
    const faqSelectors = [
      '.faq', '.faqs', '.frequently-asked-questions', '.q-and-a', '.questions',
      '[class*="faq"]', '[id*="faq"]', '.accordion', '.collapsible'
    ];

    faqSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const content = $(element).text().trim();
        if (content.length > 50) {
          const headings = this.extractHeadings($(element));
          const keywords = this.extractKeywords(content);
          const entities = this.extractEntities(content);

          chunks.push({
            id: this.generateChunkId('faq', content),
            type: 'faq',
            content: this.cleanAndCompress(content),
            tokens: this.estimateTokens(content),
            relevanceScore: this.calculateRelevanceScore(content, 'faq'),
            metadata: { headings, keywords, entities }
          });
        }
      });
    });
  }

  /**
   * Extract feature-related chunks
   */
  static extractFeatureChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[]): void {
    const featureSelectors = [
      '.features', '.feature-list', '.benefits', '.capabilities',
      '[class*="feature"]', '[class*="benefit"]', '.services', '.offerings'
    ];

    featureSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const content = $(element).text().trim();
        if (content.length > 50) {
          const headings = this.extractHeadings($(element));
          const keywords = this.extractKeywords(content);
          const entities = this.extractEntities(content);

          chunks.push({
            id: this.generateChunkId('features', content),
            type: 'features',
            content: this.cleanAndCompress(content),
            tokens: this.estimateTokens(content),
            relevanceScore: this.calculateRelevanceScore(content, 'features'),
            metadata: { headings, keywords, entities }
          });
        }
      });
    });
  }

  /**
   * Extract specification-related chunks
   */
  static extractSpecChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[]): void {
    const specSelectors = [
      '.specs', '.specifications', '.technical', '.details', '.parameters',
      '[class*="spec"]', 'table', '.data-table', '.product-details'
    ];

    specSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const content = $(element).text().trim();
        if (content.length > 50) {
          const headings = this.extractHeadings($(element));
          const keywords = this.extractKeywords(content);
          const entities = this.extractEntities(content);

          chunks.push({
            id: this.generateChunkId('specs', content),
            type: 'specs',
            content: this.cleanAndCompress(content),
            tokens: this.estimateTokens(content),
            relevanceScore: this.calculateRelevanceScore(content, 'specs'),
            metadata: { headings, keywords, entities }
          });
        }
      });
    });
  }

  /**
   * Extract support-related chunks
   */
  static extractSupportChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[]): void {
    const supportSelectors = [
      '.support', '.help', '.assistance', '.contact', '.customer-service',
      '[class*="support"]', '[class*="help"]', '.documentation', '.guides'
    ];

    supportSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const content = $(element).text().trim();
        if (content.length > 50) {
          const headings = this.extractHeadings($(element));
          const keywords = this.extractKeywords(content);
          const entities = this.extractEntities(content);

          chunks.push({
            id: this.generateChunkId('support', content),
            type: 'support',
            content: this.cleanAndCompress(content),
            tokens: this.estimateTokens(content),
            relevanceScore: this.calculateRelevanceScore(content, 'support'),
            metadata: { headings, keywords, entities }
          });
        }
      });
    });
  }

  /**
   * Extract legal-related chunks
   */
  static extractLegalChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[]): void {
    const legalSelectors = [
      '.legal', '.terms', '.privacy', '.policy', '.disclaimer', '.copyright',
      '[class*="legal"]', '[class*="terms"]', '[class*="privacy"]'
    ];

    legalSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const content = $(element).text().trim();
        if (content.length > 50) {
          const headings = this.extractHeadings($(element));
          const keywords = this.extractKeywords(content);
          const entities = this.extractEntities(content);

          chunks.push({
            id: this.generateChunkId('legal', content),
            type: 'legal',
            content: this.cleanAndCompress(content),
            tokens: this.estimateTokens(content),
            relevanceScore: this.calculateRelevanceScore(content, 'legal'),
            metadata: { headings, keywords, entities }
          });
        }
      });
    });
  }

  /**
   * Extract main content chunks
   */
  static extractMainContentChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[], baseContent: ExtractedContent): void {
    // Split main content into paragraphs
    const paragraphs = baseContent.content.split(/\n\s*\n/).filter(p => p.trim().length > 100);

    paragraphs.forEach((paragraph, index) => {
      const content = paragraph.trim();
      const headings = this.extractHeadings(cheerio.load(`<div>${content}</div>`)('div'));
      const keywords = this.extractKeywords(content);
      const entities = this.extractEntities(content);

      chunks.push({
        id: this.generateChunkId('main', content + index),
        type: 'main',
        content: this.cleanAndCompress(content),
        tokens: this.estimateTokens(content),
        relevanceScore: this.calculateRelevanceScore(content, 'main'),
        metadata: { headings, keywords, entities }
      });
    });
  }

  /**
   * Helper: Extract headings from an element
   */
  private static extractHeadings($element: cheerio.Cheerio<any>): string[] {
    const headings: string[] = [];
    $element.find('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const $el = cheerio.load(el);
      const heading = $el.text().trim();
      if (heading && heading.length > 3) {
        headings.push(heading);
      }
    });
    return headings;
  }

  /**
   * Helper: Extract keywords based on word frequency
   */
  private static extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && word.length < 20);

    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Helper: Extract entities (proper nouns, emails, URLs)
   */
  private static extractEntities(content: string): string[] {
    const entities = new Set<string>();

    // Capitalized words (proper nouns)
    const capitalizedWords = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    capitalizedWords.forEach(word => {
      if (word.length > 3 && word.length < 50) {
        entities.add(word);
      }
    });

    // Email addresses
    const emails = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    emails.forEach(email => entities.add(email));

    // URLs
    const urls = content.match(/https?:\/\/[^\s]+/g) || [];
    urls.forEach(url => entities.add(url));

    return Array.from(entities).slice(0, 15);
  }

  /**
   * Helper: Generate chunk ID
   */
  private static generateChunkId(type: string, content: string): string {
    const hash = createHash('md5').update(content).digest('hex').substring(0, 8);
    return `${type}_${hash}`;
  }

  /**
   * Helper: Calculate relevance score based on content type
   */
  private static calculateRelevanceScore(content: string, type: string): number {
    let score = Math.min(content.length / 1000, 1.0);

    const typeKeywords = {
      faq: ['question', 'answer', 'how', 'what', 'why', 'when', 'where'],
      features: ['feature', 'benefit', 'advantage', 'capability', 'service'],
      specs: ['specification', 'technical', 'parameter', 'requirement', 'detail'],
      support: ['help', 'support', 'assist', 'guide', 'documentation', 'contact'],
      legal: ['terms', 'privacy', 'policy', 'legal', 'copyright', 'license'],
      main: ['overview', 'introduction', 'about', 'description', 'summary']
    };

    const keywords = typeKeywords[type as keyof typeof typeKeywords] || [];
    const lowerContent = content.toLowerCase();

    keywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        score += 0.1;
      }
    });

    return Math.min(score, 1.0);
  }

  /**
   * Helper: Clean and compress content
   */
  private static cleanAndCompress(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * Helper: Estimate token count
   */
  private static estimateTokens(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 0.75);
  }
}
