/**
 * CSV Export Generator
 *
 * Purpose: Main entry point for CSV export functionality, providing functions
 * to export search results in various formats (single export, streaming, thread-based).
 *
 * Last Updated: 2025-11-10
 * Refactored: Extracted utilities to comply with 300 LOC limit
 */

import { SearchResult } from '@/lib/search/conversation-search';
import { Readable } from 'stream';
import { buildHeaders, buildRow, buildThreadHeaders, buildThreadRow } from './csv/data-transformer';
import { escapeCSV, formatDate } from './csv/csv-formatter';
import { createCSVStream, linesToCSV } from './csv/csv-writer';
import { calculateOverallSentiment, getSentimentDistribution } from './csv/sentiment-analyzer';

export interface CSVExportOptions {
  includeHeaders?: boolean;
  delimiter?: string;
  dateFormat?: 'ISO' | 'US' | 'EU';
  includeScore?: boolean;
  includeHighlight?: boolean;
  includeSentiment?: boolean;
}

const DEFAULT_OPTIONS: CSVExportOptions = {
  includeHeaders: true,
  delimiter: ',',
  dateFormat: 'ISO',
  includeScore: true,
  includeHighlight: false,
  includeSentiment: true
};

/**
 * Export search results to CSV format
 *
 * @param results - Array of search results to export
 * @param options - CSV export options
 * @returns CSV string
 */
export function exportToCSV(
  results: SearchResult[],
  options: CSVExportOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Add headers
  if (opts.includeHeaders) {
    const headers = buildHeaders(opts);
    lines.push(headers.join(opts.delimiter));
  }

  // Add data rows
  for (const result of results) {
    const row = buildRow(result, opts);
    lines.push(row.join(opts.delimiter));
  }

  return linesToCSV(lines);
}

/**
 * Export search results as a readable stream (for large datasets)
 *
 * @param results - Array of search results to export
 * @param options - CSV export options
 * @returns Readable stream of CSV data
 */
export function exportToCSVStream(
  results: SearchResult[],
  options: CSVExportOptions = {}
): Readable {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return createCSVStream(results, opts);
}

/**
 * Generate CSV with conversation thread context
 *
 * @param conversations - Map of conversation ID to messages
 * @param options - CSV export options
 * @returns CSV string with conversation threads
 */
export async function exportConversationThreadsToCSV(
  conversations: Map<string, SearchResult[]>,
  options: CSVExportOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Add headers
  if (opts.includeHeaders) {
    const headers = buildThreadHeaders(opts);
    lines.push(headers.join(opts.delimiter));
  }

  // Process each conversation
  for (const [convId, messages] of conversations.entries()) {
    if (messages.length === 0) continue;

    const row = buildThreadRow(convId, messages, opts);

    if (opts.includeSentiment) {
      // Calculate overall sentiment
      const sentiments = messages
        .map(m => m.sentiment)
        .filter(s => s);
      const overallSentiment = calculateOverallSentiment(sentiments);
      row.push(escapeCSV(overallSentiment));
    }

    lines.push(row.join(opts.delimiter));
  }

  return linesToCSV(lines);
}

/**
 * Generate CSV summary report with statistics
 *
 * @param results - Search results to summarize
 * @param searchQuery - Original search query
 * @param filters - Applied filters
 * @param executionTime - Query execution time in ms
 * @returns CSV string with summary report
 */
export function generateSearchSummaryCSV(
  results: SearchResult[],
  searchQuery: string,
  filters: any,
  executionTime: number
): string {
  const lines: string[] = [];

  // Summary section
  lines.push('Search Summary Report');
  lines.push('');
  lines.push(`Search Query,${escapeCSV(searchQuery)}`);
  lines.push(`Date Range,${filters.dateFrom || 'Any'} to ${filters.dateTo || 'Any'}`);
  lines.push(`Total Results,${results.length}`);
  lines.push(`Execution Time,${executionTime.toFixed(2)}ms`);
  lines.push('');

  // Statistics section
  lines.push('Statistics');
  lines.push('');

  // Group by domain
  const byDomain = new Map<string, number>();
  results.forEach(r => {
    const domain = r.domainName || 'Unknown';
    byDomain.set(domain, (byDomain.get(domain) || 0) + 1);
  });

  lines.push('Domain,Result Count');
  for (const [domain, count] of byDomain.entries()) {
    lines.push(`${escapeCSV(domain)},${count}`);
  }
  lines.push('');

  // Sentiment distribution
  const sentiments = results.map(r => r.sentiment);
  const distribution = getSentimentDistribution(sentiments);

  lines.push('Sentiment,Count');
  lines.push(`Positive,${distribution.positive}`);
  lines.push(`Negative,${distribution.negative}`);
  lines.push(`Neutral,${distribution.neutral}`);
  lines.push('');

  // Add detailed results
  lines.push('Detailed Results');
  lines.push('');

  const csvContent = exportToCSV(results);
  lines.push(csvContent);

  return linesToCSV(lines);
}
