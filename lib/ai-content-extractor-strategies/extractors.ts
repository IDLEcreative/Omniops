/**
 * Content Extraction Strategy Implementations
 */

import * as cheerio from 'cheerio';
import { ExtractedContent } from '../content-extractor';
import { SemanticChunk } from '../ai-content-extractor-types';
import {
  extractHeadings,
  extractKeywords,
  extractEntities,
  generateChunkId,
  calculateRelevanceScore,
  cleanAndCompress,
  estimateTokens
} from './helpers';

/**
 * Extract FAQ-related chunks
 */
export function extractFAQChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[]): void {
  const faqSelectors = [
    '.faq', '.faqs', '.frequently-asked-questions', '.q-and-a', '.questions',
    '[class*="faq"]', '[id*="faq"]', '.accordion', '.collapsible'
  ];

  faqSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const content = $(element).text().trim();
      if (content.length > 50) {
        const headings = extractHeadings($(element));
        const keywords = extractKeywords(content);
        const entities = extractEntities(content);

        chunks.push({
          id: generateChunkId('faq', content),
          type: 'faq',
          content: cleanAndCompress(content),
          tokens: estimateTokens(content),
          relevanceScore: calculateRelevanceScore(content, 'faq'),
          metadata: { headings, keywords, entities }
        });
      }
    });
  });
}

/**
 * Extract feature-related chunks
 */
export function extractFeatureChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[]): void {
  const featureSelectors = [
    '.features', '.feature-list', '.benefits', '.capabilities',
    '[class*="feature"]', '[class*="benefit"]', '.services', '.offerings'
  ];

  featureSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const content = $(element).text().trim();
      if (content.length > 50) {
        const headings = extractHeadings($(element));
        const keywords = extractKeywords(content);
        const entities = extractEntities(content);

        chunks.push({
          id: generateChunkId('features', content),
          type: 'features',
          content: cleanAndCompress(content),
          tokens: estimateTokens(content),
          relevanceScore: calculateRelevanceScore(content, 'features'),
          metadata: { headings, keywords, entities }
        });
      }
    });
  });
}

/**
 * Extract specification-related chunks
 */
export function extractSpecChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[]): void {
  const specSelectors = [
    '.specs', '.specifications', '.technical', '.details', '.parameters',
    '[class*="spec"]', 'table', '.data-table', '.product-details'
  ];

  specSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const content = $(element).text().trim();
      if (content.length > 50) {
        const headings = extractHeadings($(element));
        const keywords = extractKeywords(content);
        const entities = extractEntities(content);

        chunks.push({
          id: generateChunkId('specs', content),
          type: 'specs',
          content: cleanAndCompress(content),
          tokens: estimateTokens(content),
          relevanceScore: calculateRelevanceScore(content, 'specs'),
          metadata: { headings, keywords, entities }
        });
      }
    });
  });
}

/**
 * Extract support-related chunks
 */
export function extractSupportChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[]): void {
  const supportSelectors = [
    '.support', '.help', '.assistance', '.contact', '.customer-service',
    '[class*="support"]', '[class*="help"]', '.documentation', '.guides'
  ];

  supportSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const content = $(element).text().trim();
      if (content.length > 50) {
        const headings = extractHeadings($(element));
        const keywords = extractKeywords(content);
        const entities = extractEntities(content);

        chunks.push({
          id: generateChunkId('support', content),
          type: 'support',
          content: cleanAndCompress(content),
          tokens: estimateTokens(content),
          relevanceScore: calculateRelevanceScore(content, 'support'),
          metadata: { headings, keywords, entities }
        });
      }
    });
  });
}

/**
 * Extract legal-related chunks
 */
export function extractLegalChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[]): void {
  const legalSelectors = [
    '.legal', '.terms', '.privacy', '.policy', '.disclaimer', '.copyright',
    '[class*="legal"]', '[class*="terms"]', '[class*="privacy"]'
  ];

  legalSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const content = $(element).text().trim();
      if (content.length > 50) {
        const headings = extractHeadings($(element));
        const keywords = extractKeywords(content);
        const entities = extractEntities(content);

        chunks.push({
          id: generateChunkId('legal', content),
          type: 'legal',
          content: cleanAndCompress(content),
          tokens: estimateTokens(content),
          relevanceScore: calculateRelevanceScore(content, 'legal'),
          metadata: { headings, keywords, entities }
        });
      }
    });
  });
}

/**
 * Extract main content chunks
 */
export function extractMainContentChunks($: cheerio.CheerioAPI, chunks: SemanticChunk[], baseContent: ExtractedContent): void {
  // Split main content into paragraphs
  const paragraphs = baseContent.content.split(/\n\s*\n/).filter(p => p.trim().length > 100);

  paragraphs.forEach((paragraph, index) => {
    const content = paragraph.trim();
    const headings = extractHeadings(cheerio.load(`<div>${content}</div>`)('div'));
    const keywords = extractKeywords(content);
    const entities = extractEntities(content);

    chunks.push({
      id: generateChunkId('main', content + index),
      type: 'main',
      content: cleanAndCompress(content),
      tokens: estimateTokens(content),
      relevanceScore: calculateRelevanceScore(content, 'main'),
      metadata: { headings, keywords, entities }
    });
  });
}
