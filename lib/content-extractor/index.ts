/**
 * Content Extractor - Main API
 */

import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { extractBusinessInfo } from '../business-content-extractor';
import type { ExtractedContent } from './types';
import { htmlToText, stripBoilerplate } from './converters';
import { extractMetadata, extractImages, extractLinks, fallbackExtraction } from './extractors';
import { cleanContent, generateContentHash, isValidContent } from './utilities';

export type { ExtractedContent };

export class ContentExtractor {
  /**
   * Extract content using Mozilla's Readability for better accuracy
   */
  static extractWithReadability(html: string, url: string): ExtractedContent {
    // First, extract business information before any stripping
    const businessInfo = extractBusinessInfo(html);

    // Create virtual DOM
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Clone document for Readability (it modifies the DOM) and strip boilerplate
    const documentClone = document.cloneNode(true) as Document;
    stripBoilerplate(documentClone);

    // Extract metadata before Readability modifies DOM
    const metadata = extractMetadata(document);
    const images = extractImages(document);
    const links = extractLinks(document, url);

    // Use Readability for main content extraction
    const reader = new Readability(documentClone);
    const article = reader.parse();

    let content = '';
    let textContent = '';
    let title = '';
    let excerpt = '';

    if (article && article.content) {
      // Convert HTML to text (includes secondary boilerplate removal)
      content = htmlToText(article.content);
      textContent = article.textContent || '';
      title = article.title || metadata.title || '';
      excerpt = article.excerpt || metadata.description || '';
    } else {
      // Fallback to basic extraction
      const extracted = fallbackExtraction(document);
      content = extracted.content;
      textContent = extracted.textContent;
      title = extracted.title;
      excerpt = metadata.description || '';
    }

    // Clean up content
    content = cleanContent(content);

    // Calculate metrics
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    // Generate content hash for deduplication
    const contentHash = generateContentHash(textContent);

    return {
      title,
      content,
      textContent,
      excerpt,
      author: metadata.author,
      publishedDate: metadata.publishedDate,
      modifiedDate: metadata.modifiedDate,
      lang: document.documentElement.lang || 'en',
      images,
      links,
      metadata,
      contentHash,
      wordCount,
      readingTime,
      businessInfo, // Include preserved business information
    };
  }

  /**
   * Fallback extraction using cheerio
   */
  static fallbackExtraction(document: Document): { content: string; textContent: string; title: string } {
    return fallbackExtraction(document);
  }

  /**
   * Extract metadata from the document
   */
  static extractMetadata(document: Document): Record<string, any> {
    return extractMetadata(document);
  }

  /**
   * Extract images with alt text
   */
  static extractImages(document: Document): Array<{ src: string; alt: string }> {
    return extractImages(document);
  }

  /**
   * Extract links
   */
  static extractLinks(document: Document, baseUrl: string): Array<{ href: string; text: string }> {
    return extractLinks(document, baseUrl);
  }

  /**
   * Clean content
   */
  static cleanContent(content: string): string {
    return cleanContent(content);
  }

  /**
   * Generate content hash for deduplication
   */
  static generateContentHash(content: string): string {
    return generateContentHash(content);
  }

  /**
   * Check if content is meaningful (not error pages, etc.)
   */
  static isValidContent(content: ExtractedContent): boolean {
    return isValidContent(content);
  }
}
