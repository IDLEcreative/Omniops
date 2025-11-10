/**
 * CSV Data Transformation
 *
 * Purpose: Functions for building CSV headers and rows from search results,
 * handling column selection based on export options.
 *
 * Last Updated: 2025-11-10
 */

import { SearchResult } from '@/lib/search/conversation-search';
import { CSVExportOptions } from '../csv-generator';
import { escapeCSV, formatDate, stripHtml } from './csv-formatter';

/**
 * Build CSV headers based on export options
 *
 * @param options - CSV export options controlling which columns to include
 * @returns Array of header strings
 */
export function buildHeaders(options: CSVExportOptions): string[] {
  const headers = [
    'Conversation ID',
    'Message ID',
    'Date & Time',
    'Customer Email',
    'Domain',
    'Role',
    'Content'
  ];

  if (options.includeSentiment) {
    headers.push('Sentiment');
  }

  if (options.includeScore) {
    headers.push('Relevance Score');
  }

  if (options.includeHighlight) {
    headers.push('Highlighted Text');
  }

  return headers;
}

/**
 * Build a CSV row from a search result
 *
 * @param result - Search result to transform
 * @param options - CSV export options controlling which columns to include
 * @returns Array of escaped CSV values
 */
export function buildRow(result: SearchResult, options: CSVExportOptions): string[] {
  const row = [
    escapeCSV(result.conversationId),
    escapeCSV(result.messageId),
    formatDate(result.createdAt, options.dateFormat),
    escapeCSV(result.customerEmail || ''),
    escapeCSV(result.domainName || ''),
    escapeCSV(result.role),
    escapeCSV(result.content)
  ];

  if (options.includeSentiment) {
    row.push(escapeCSV(result.sentiment || 'neutral'));
  }

  if (options.includeScore) {
    row.push(result.relevanceScore.toFixed(4));
  }

  if (options.includeHighlight) {
    row.push(escapeCSV(stripHtml(result.highlight)));
  }

  return row;
}

/**
 * Build headers for conversation thread export
 *
 * @param options - CSV export options
 * @returns Array of header strings for thread export
 */
export function buildThreadHeaders(options: CSVExportOptions): string[] {
  const headers = [
    'Conversation ID',
    'Start Time',
    'End Time',
    'Customer Email',
    'Domain',
    'Message Count',
    'Messages'
  ];

  if (options.includeSentiment) {
    headers.push('Overall Sentiment');
  }

  return headers;
}

/**
 * Build a CSV row for a conversation thread
 *
 * @param convId - Conversation ID
 * @param messages - Array of messages in the conversation
 * @param options - CSV export options
 * @returns Array of escaped CSV values
 */
export function buildThreadRow(
  convId: string,
  messages: SearchResult[],
  options: CSVExportOptions
): string[] {
  // Sort messages by time
  messages.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];

  if (!firstMessage || !lastMessage) {
    throw new Error('Cannot build thread row from empty message array');
  }

  // Combine message contents
  const messageThread = messages
    .map(m => `[${m.role}]: ${m.content}`)
    .join(' | ');

  const row = [
    escapeCSV(convId),
    formatDate(firstMessage.createdAt, options.dateFormat),
    formatDate(lastMessage.createdAt, options.dateFormat),
    escapeCSV(firstMessage.customerEmail || ''),
    escapeCSV(firstMessage.domainName || ''),
    messages.length.toString(),
    escapeCSV(messageThread)
  ];

  return row;
}
