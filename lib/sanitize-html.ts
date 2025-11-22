/**
 * HTML Sanitization Utilities
 * Provides safe HTML sanitization to prevent XSS attacks
 *
 * NOTE: This file uses DOMPurify which is client-side only.
 * For server-side contexts, it falls back to HTML escaping.
 * For JSON/config sanitization without HTML parsing, use @/lib/sanitize-json instead.
 */

'use client';

import { escapeHTML } from '@/lib/sanitize-json';

// Re-export JSON sanitization utilities from sanitize-json
export { sanitizeConfigString, escapeHTML } from '@/lib/sanitize-json';

// Lazy load DOMPurify only on client-side
let DOMPurify: any = null;
if (typeof window !== 'undefined') {
  import('dompurify').then((module) => {
    DOMPurify = module.default;
  });
}

/**
 * Sanitize HTML content for safe rendering
 * Uses DOMPurify with strict configuration (client-side only)
 *
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHTML(html: string): string {
  // Server-side or DOMPurify not loaded yet - use escapeHTML fallback
  if (typeof window === 'undefined' || !DOMPurify) {
    return escapeHTML(html);
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'mark'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}

/**
 * Sanitize user-generated content with more permissive rules
 * Allows common formatting tags but still prevents XSS
 *
 * @param html - User-generated HTML
 * @returns Sanitized HTML
 */
export function sanitizeUserContent(html: string): string {
  // Server-side or DOMPurify not loaded yet - use escapeHTML fallback
  if (typeof window === 'undefined' || !DOMPurify) {
    return escapeHTML(html);
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'mark'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize HTML for React's dangerouslySetInnerHTML
 * Returns object in the format required by React
 *
 * @param html - Raw HTML string to sanitize
 * @returns Object with __html property containing sanitized HTML
 */
export function sanitizeForReact(html: string): { __html: string } {
  return {
    __html: sanitizeHTML(html)
  };
}

/**
 * Validate and sanitize URLs to prevent javascript: and data: URIs
 *
 * @param url - URL to validate
 * @returns Safe URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url, window?.location?.origin || 'https://omniops.co.uk');

    // Only allow http, https, and mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '';
    }

    return parsed.href;
  } catch {
    return '';
  }
}
