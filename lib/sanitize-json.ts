/**
 * JSON Sanitization Utilities
 * Safe escaping for embedding JSON in HTML script tags
 */

/**
 * Sanitize configuration objects for safe injection into script tags
 * Escapes special characters that could break out of JSON context
 *
 * @param config - Configuration object to sanitize
 * @returns JSON string with escaped special characters
 */
export function sanitizeConfigString(config: any): string {
  return JSON.stringify(config)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027')
    .replace(/"/g, '\\u0022');
}

/**
 * Escape HTML entities for server-side rendering
 *
 * @param text - Text to escape
 * @returns Escaped text safe for HTML context
 */
export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}
