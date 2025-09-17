import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { extractBusinessInfo, selectiveStripBoilerplate, smartHtmlToText, BusinessInfo } from './business-content-extractor';
import { extractProductData, formatProductContent, ProductData } from './product-content-extractor';

// We'll skip Turndown for now to avoid import issues - can use HTML directly
// or convert to text without markdown formatting

// Helper function to convert HTML to plain text
// Now uses smart extraction that preserves business info
function htmlToText(html: string): string {
  return smartHtmlToText(html);
}

// Strip boilerplate/navigation from a DOM document (mutates the document)
// Now uses selective stripping that preserves business-critical information
function stripBoilerplate(document: Document): void {
  const html = document.documentElement.outerHTML;
  const $ = cheerio.load(html);
  
  // Apply selective stripping
  selectiveStripBoilerplate($);
  
  // Update the document with the cleaned HTML
  document.documentElement.innerHTML = $.html();
}

export interface ExtractedContent {
  title: string;
  content: string;
  textContent: string; // Plain text for hashing
  excerpt: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  lang: string;
  images: Array<{ src: string; alt: string }>;
  links: Array<{ href: string; text: string }>;
  metadata: Record<string, any>;
  contentHash: string;
  wordCount: number;
  readingTime: number; // in minutes
  businessInfo?: BusinessInfo; // Preserved business-critical information
}

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
    const metadata = this.extractMetadata(document);
    const images = this.extractImages(document);
    const links = this.extractLinks(document, url);
    
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
      const extracted = this.fallbackExtraction(document);
      content = extracted.content;
      textContent = extracted.textContent;
      title = extracted.title;
      excerpt = metadata.description || '';
    }
    
    // Clean up content
    content = this.cleanContent(content);
    
    // Calculate metrics
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    // Generate content hash for deduplication
    const contentHash = this.generateContentHash(textContent);
    
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
    const $ = cheerio.load(document.documentElement.outerHTML);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, form, iframe, object, embed').remove();
    $('.nav, .header, .footer, .sidebar, .advertisement, .ads, .social-share, .comments').remove();
    $('[class*="sidebar"], [class*="header"], [class*="footer"], [class*="nav"]').remove();
    $('[id*="sidebar"], [id*="header"], [id*="footer"], [id*="nav"]').remove();
    
    // Try to find main content using various selectors
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '#main-content',
      '.post-content',
      '.entry-content',
      '.content-area',
      '.article-body',
      '.story-body',
      '.c-entry-content',
      '.Post-body',
      '#content',
      '.content',
      'body',
    ];
    
    let mainContent = '';
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 100) {
        mainContent = element.html() || '';
        break;
      }
    }
    
    // Get title
    const title = $('title').text() || 
                  $('h1').first().text() || 
                  $('meta[property="og:title"]').attr('content') || 
                  '';
    
    // Convert to markdown
    const content = htmlToText(mainContent);
    const textContent = $(mainContent).text();
    
    return { content, textContent, title: title.trim() };
  }
  
  /**
   * Extract metadata from the document
   */
  static extractMetadata(document: Document): Record<string, any> {
    const getMeta = (name: string): string | null => {
      const element = document.querySelector(
        `meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"], meta[property="article:${name}"]`
      );
      return element ? element.getAttribute('content') : null;
    };
    
    // Extract JSON-LD structured data
    let structuredData = {};
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '{}');
        structuredData = { ...structuredData, ...data };
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    return {
      title: getMeta('title') || document.title,
      description: getMeta('description'),
      author: getMeta('author') || getMeta('article:author'),
      publishedDate: getMeta('published_time') || getMeta('datePublished'),
      modifiedDate: getMeta('modified_time') || getMeta('dateModified'),
      keywords: getMeta('keywords'),
      type: getMeta('type'),
      image: getMeta('image'),
      site_name: getMeta('site_name'),
      ...structuredData,
    };
  }
  
  /**
   * Extract images with alt text
   */
  static extractImages(document: Document): Array<{ src: string; alt: string }> {
    const images: Array<{ src: string; alt: string }> = [];
    const imgElements = document.querySelectorAll('img');
    
    imgElements.forEach(img => {
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (src && !src.includes('data:image')) { // Skip base64 images
        images.push({
          src: src,
          alt: img.alt || img.getAttribute('title') || 'Image',
        });
      }
    });
    
    return images;
  }
  
  /**
   * Extract links
   */
  static extractLinks(document: Document, baseUrl: string): Array<{ href: string; text: string }> {
    const links: Array<{ href: string; text: string }> = [];
    const linkElements = document.querySelectorAll('a[href]');
    const baseUrlObj = new URL(baseUrl);
    
    linkElements.forEach(link => {
      try {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          const absoluteUrl = new URL(href, baseUrl).href;
          const linkUrl = new URL(absoluteUrl);
          
          // Only include same-domain links
          if (linkUrl.hostname === baseUrlObj.hostname) {
            links.push({
              href: absoluteUrl,
              text: link.textContent?.trim() || '',
            });
          }
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    });
    
    // Remove duplicates
    const uniqueLinks = Array.from(
      new Map(links.map(link => [link.href, link])).values()
    );
    
    return uniqueLinks;
  }
  
  /**
   * Clean content
   */
  static cleanContent(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/\s+$/gm, '') // Remove trailing spaces
      .replace(/^\s+/gm, '') // Remove leading spaces
      .replace(/\[(.+?)\]\(\)/g, '$1') // Remove empty links
      .replace(/!\[(.+?)\]\(\)/g, '') // Remove broken images
      .trim();
  }
  
  /**
   * Generate content hash for deduplication
   */
  static generateContentHash(content: string): string {
    // Normalize content for hashing
    const normalized = content
      .toLowerCase()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .trim();
    
    return createHash('sha256')
      .update(normalized)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for efficiency
  }
  
  /**
   * Check if content is meaningful (not error pages, etc.)
   */
  static isValidContent(content: ExtractedContent): boolean {
    // Check minimum word count
    if (content.wordCount < 50) {
      return false;
    }
    
    // Check for common error page indicators
    const errorIndicators = [
      '404 not found',
      '403 forbidden',
      '500 internal server error',
      'access denied',
      'page not found',
      'error occurred',
    ];
    
    const lowerContent = content.textContent.toLowerCase();
    for (const indicator of errorIndicators) {
      if (lowerContent.includes(indicator) && content.wordCount < 200) {
        return false;
      }
    }
    
    return true;
  }
}
