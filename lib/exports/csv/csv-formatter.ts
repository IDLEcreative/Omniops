/**
 * CSV Formatting Utilities
 *
 * Purpose: Core CSV formatting functions for escaping special characters,
 * handling delimiters, and ensuring RFC 4180 compliance.
 *
 * Last Updated: 2025-11-10
 */

/**
 * Escape special CSV characters according to RFC 4180
 *
 * @param value - String value to escape
 * @returns Escaped CSV value with quotes if needed
 *
 * @example
 * escapeCSV('Hello, World') // '"Hello, World"'
 * escapeCSV('Simple text')  // 'Simple text'
 */
export function escapeCSV(value: string): string {
  if (!value) return '""';

  // Check if value needs escaping
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    // Escape quotes by doubling them
    value = value.replace(/"/g, '""');
    // Wrap in quotes
    return `"${value}"`;
  }

  return value;
}

/**
 * Format date according to specified format
 *
 * @param dateString - ISO date string
 * @param format - Date format (ISO, US, EU)
 * @returns Formatted date string
 *
 * @example
 * formatDate('2025-11-10T10:00:00Z', 'US') // '11/10/2025 10:00:00 AM'
 * formatDate('2025-11-10T10:00:00Z', 'ISO') // '2025-11-10T10:00:00.000Z'
 */
export function formatDate(dateString: string, format?: string): string {
  const date = new Date(dateString);

  switch (format) {
    case 'US':
      return date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString('en-US');
    case 'EU':
      return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB');
    case 'ISO':
    default:
      return date.toISOString();
  }
}

/**
 * Strip HTML tags from text
 *
 * @param html - HTML string
 * @returns Plain text without HTML tags
 *
 * @example
 * stripHtml('<p>Hello <strong>World</strong></p>') // 'Hello World'
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Join CSV values with delimiter
 *
 * @param values - Array of CSV values
 * @param delimiter - Delimiter character (default: ',')
 * @returns Joined CSV row
 */
export function joinCSVRow(values: string[], delimiter: string = ','): string {
  return values.join(delimiter);
}
