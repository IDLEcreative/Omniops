/**
 * CSV Stream Writer
 *
 * Purpose: Utilities for creating CSV streams for large dataset exports,
 * handling chunked processing to avoid memory issues.
 *
 * Last Updated: 2025-11-10
 */

import { Readable } from 'stream';
import { SearchResult } from '@/lib/search/conversation-search';
import { CSVExportOptions } from '../csv-generator';
import { buildHeaders, buildRow } from './data-transformer';

/**
 * Create a readable stream for CSV export
 *
 * Uses chunked processing to handle large datasets efficiently without
 * loading everything into memory at once.
 *
 * @param results - Array of search results to export
 * @param options - CSV export options
 * @param chunkSize - Number of rows to process per chunk (default: 100)
 * @returns Readable stream of CSV data
 */
export function createCSVStream(
  results: SearchResult[],
  options: CSVExportOptions,
  chunkSize: number = 100
): Readable {
  let index = 0;
  let headersSent = false;

  return new Readable({
    read() {
      // Send headers first
      if (!headersSent && options.includeHeaders) {
        const headers = buildHeaders(options);
        this.push(headers.join(options.delimiter || ',') + '\n');
        headersSent = true;
      }

      // Send data in chunks
      let count = 0;

      while (index < results.length && count < chunkSize) {
        const result = results[index];
        if (result) {
          const row = buildRow(result, options);
          this.push(row.join(options.delimiter || ',') + '\n');
        }
        index++;
        count++;
      }

      // Signal end of stream
      if (index >= results.length) {
        this.push(null);
      }
    }
  });
}

/**
 * Convert array of strings to CSV string
 *
 * @param lines - Array of CSV lines
 * @returns CSV string with newline separators
 */
export function linesToCSV(lines: string[]): string {
  return lines.join('\n');
}
