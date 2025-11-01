/**
 * Helper Functions for Content Extraction
 */

import * as cheerio from 'cheerio';
import { createHash } from 'crypto';

/**
 * Helper: Extract headings from an element
 */
export function extractHeadings($element: cheerio.Cheerio<any>): string[] {
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
export function extractKeywords(content: string): string[] {
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
export function extractEntities(content: string): string[] {
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
export function generateChunkId(type: string, content: string): string {
  const hash = createHash('md5').update(content).digest('hex').substring(0, 8);
  return `${type}_${hash}`;
}

/**
 * Helper: Calculate relevance score based on content type
 */
export function calculateRelevanceScore(content: string, type: string): number {
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
export function cleanAndCompress(content: string): string {
  return content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Helper: Estimate token count
 */
export function estimateTokens(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words * 0.75);
}
