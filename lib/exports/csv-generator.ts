import { SearchResult } from '@/lib/search/conversation-search';
import { Readable } from 'stream';

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

  return lines.join('\n');
}

/**
 * Export search results as a readable stream (for large datasets)
 */
export function exportToCSVStream(
  results: SearchResult[],
  options: CSVExportOptions = {}
): Readable {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let index = 0;
  let headersSent = false;

  return new Readable({
    read() {
      // Send headers first
      if (!headersSent && opts.includeHeaders) {
        const headers = buildHeaders(opts);
        this.push(headers.join(opts.delimiter) + '\n');
        headersSent = true;
      }

      // Send data in chunks
      const chunkSize = 100;
      let count = 0;

      while (index < results.length && count < chunkSize) {
        const result = results[index];
        const row = buildRow(result, opts);
        this.push(row.join(opts.delimiter) + '\n');
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
 * Build CSV headers
 */
function buildHeaders(options: CSVExportOptions): string[] {
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
 */
function buildRow(result: SearchResult, options: CSVExportOptions): string[] {
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
 * Escape special CSV characters
 */
function escapeCSV(value: string): string {
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
 */
function formatDate(dateString: string, format?: string): string {
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
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Generate CSV with conversation thread context
 */
export async function exportConversationThreadsToCSV(
  conversations: Map<string, SearchResult[]>,
  options: CSVExportOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Add headers
  if (opts.includeHeaders) {
    const headers = [
      'Conversation ID',
      'Start Time',
      'End Time',
      'Customer Email',
      'Domain',
      'Message Count',
      'Messages'
    ];
    if (opts.includeSentiment) {
      headers.push('Overall Sentiment');
    }
    lines.push(headers.join(opts.delimiter));
  }

  // Process each conversation
  for (const [convId, messages] of conversations.entries()) {
    if (messages.length === 0) continue;

    // Sort messages by time
    messages.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];

    // Combine message contents
    const messageThread = messages
      .map(m => `[${m.role}]: ${m.content}`)
      .join(' | ');

    const row = [
      escapeCSV(convId),
      formatDate(firstMessage.createdAt, opts.dateFormat),
      formatDate(lastMessage.createdAt, opts.dateFormat),
      escapeCSV(firstMessage.customerEmail || ''),
      escapeCSV(firstMessage.domainName || ''),
      messages.length.toString(),
      escapeCSV(messageThread)
    ];

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

  return lines.join('\n');
}

/**
 * Calculate overall sentiment from multiple messages
 */
function calculateOverallSentiment(sentiments: (string | undefined)[]): string {
  if (sentiments.length === 0) return 'neutral';

  const counts = {
    positive: 0,
    negative: 0,
    neutral: 0
  };

  for (const sentiment of sentiments) {
    if (sentiment === 'positive') counts.positive++;
    else if (sentiment === 'negative') counts.negative++;
    else counts.neutral++;
  }

  // Return the dominant sentiment
  if (counts.negative > counts.positive && counts.negative > counts.neutral) {
    return 'negative';
  } else if (counts.positive > counts.negative && counts.positive > counts.neutral) {
    return 'positive';
  } else {
    return 'neutral';
  }
}

/**
 * Generate CSV summary report
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
  const sentiments = { positive: 0, negative: 0, neutral: 0 };
  results.forEach(r => {
    const sentiment = r.sentiment || 'neutral';
    sentiments[sentiment as keyof typeof sentiments]++;
  });

  lines.push('Sentiment,Count');
  lines.push(`Positive,${sentiments.positive}`);
  lines.push(`Negative,${sentiments.negative}`);
  lines.push(`Neutral,${sentiments.neutral}`);
  lines.push('');

  // Add detailed results
  lines.push('Detailed Results');
  lines.push('');

  const csvContent = exportToCSV(results);
  lines.push(csvContent);

  return lines.join('\n');
}