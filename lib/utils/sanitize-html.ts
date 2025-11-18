/**
 * HTML Sanitization Utility
 *
 * Provides XSS protection for all HTML content rendered with dangerouslySetInnerHTML.
 * Uses DOMPurify with a strict configuration to prevent script injection attacks.
 *
 * Works in both browser and Node.js environments.
 *
 * @module sanitize-html
 */

import createDOMPurify from 'dompurify';

// Create DOMPurify instance based on environment
let DOMPurify: ReturnType<typeof createDOMPurify>;

if (typeof window !== 'undefined') {
  // Browser environment
  DOMPurify = createDOMPurify(window);
} else {
  // Node.js environment (tests, SSR)
  // Use dynamic require to avoid bundling jsdom in client code
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { JSDOM } = require('jsdom');
  const domWindow = new JSDOM('').window as unknown as Window;
  DOMPurify = createDOMPurify(domWindow);
}

/**
 * Safe HTML tags allowed in sanitized content
 * Limited to formatting and structural elements only
 */
const ALLOWED_TAGS = [
  // Text formatting
  'p', 'span', 'div', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
  // Lists
  'ul', 'ol', 'li',
  // Links (href will be sanitized)
  'a',
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Tables
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  // Code
  'code', 'pre',
  // Highlighting (used for search results)
  'mark',
];

/**
 * Safe HTML attributes allowed on elements
 * Minimal set to prevent attribute-based XSS attacks
 */
const ALLOWED_ATTRS = [
  'class',
  'id',
  'href',
  'title',
  'alt',
  'target',
  'rel',
];

/**
 * URL protocols allowed in href attributes
 * Prevents javascript:, data:, and other dangerous protocols
 */
const ALLOWED_URI_REGEXP = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

/**
 * Sanitizes HTML content to prevent XSS attacks
 *
 * @param dirty - Untrusted HTML string to sanitize
 * @returns Safe HTML string with dangerous content removed
 *
 * @example
 * ```typescript
 * // Safe: Removes script tags
 * sanitizeHtml('<p>Hello</p><script>alert("XSS")</script>')
 * // Returns: '<p>Hello</p>'
 *
 * // Safe: Removes event handlers
 * sanitizeHtml('<div onclick="alert(1)">Click</div>')
 * // Returns: '<div>Click</div>'
 *
 * // Safe: Preserves search highlights
 * sanitizeHtml('<p>Found <mark>search term</mark> here</p>')
 * // Returns: '<p>Found <mark>search term</mark> here</p>'
 * ```
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    ALLOWED_URI_REGEXP,
    // Remove all scripts and event handlers
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'base', 'form', 'input', 'textarea', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    // Additional security options
    KEEP_CONTENT: true, // Keep text content of removed tags
    ALLOW_DATA_ATTR: false, // Prevent data-* attributes which could be used for attacks
    ALLOW_UNKNOWN_PROTOCOLS: false, // Block unknown URL protocols
    SANITIZE_DOM: true, // Sanitize DOM clobbering attacks
    SAFE_FOR_TEMPLATES: true, // Escape template syntax
  });
}

/**
 * Sanitizes HTML for configuration/code blocks
 * More restrictive than general sanitization - only allows basic formatting
 *
 * @param dirty - Untrusted configuration HTML
 * @returns Sanitized HTML safe for configuration contexts
 */
export function sanitizeConfigHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['code', 'pre', 'br'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'base', 'form', 'input', 'link', 'a'],
    KEEP_CONTENT: true,
  });
}

/**
 * Checks if a string contains potentially dangerous HTML
 * Useful for validation before storing user input
 *
 * @param html - HTML string to check
 * @returns true if dangerous content detected
 */
export function containsDangerousHtml(html: string): boolean {
  const sanitized = sanitizeHtml(html);
  // If sanitization changed the content significantly, it was dangerous
  return sanitized !== html && sanitized.length < html.length * 0.9;
}
