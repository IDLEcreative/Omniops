/**
 * Types for Content Extractor
 */

import { BusinessInfo } from '../business-content-extractor';

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
