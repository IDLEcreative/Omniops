import { jsPDF } from 'jspdf';
import { SearchResult } from '@/lib/search/conversation-search';

export interface PDFExportOptions {
  title?: string;
  includeTimestamp?: boolean;
  includeFilters?: boolean;
  includeSummary?: boolean;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  fontSize?: number;
}

const DEFAULT_OPTIONS: PDFExportOptions = {
  title: 'Conversation Search Results',
  includeTimestamp: true,
  includeFilters: true,
  includeSummary: true,
  pageSize: 'a4',
  orientation: 'portrait',
  fontSize: 10
};

/**
 * Export search results to PDF
 */
export function exportToPDF(
  results: SearchResult[],
  searchQuery: string,
  filters?: any,
  options: PDFExportOptions = {}
): Uint8Array {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const doc = new jsPDF({
    orientation: opts.orientation,
    unit: 'mm',
    format: opts.pageSize
  });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Add header
  yPosition = addHeader(doc, opts.title || '', yPosition, contentWidth, opts);

  // Add search information
  if (opts.includeFilters) {
    yPosition = addSearchInfo(doc, searchQuery, filters, yPosition, contentWidth);
  }

  // Add summary statistics
  if (opts.includeSummary) {
    yPosition = addSummary(doc, results, yPosition, contentWidth);
  }

  // Add results
  yPosition = addResults(doc, results, yPosition, contentWidth, pageHeight, margin);

  // Add page numbers
  addPageNumbers(doc);

  // Return as Uint8Array
  return doc.output('arraybuffer') as Uint8Array;
}

/**
 * Add document header
 */
function addHeader(
  doc: jsPDF,
  title: string,
  y: number,
  width: number,
  options: PDFExportOptions
): number {
  const margin = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  y += 10;

  // Timestamp
  if (options.includeTimestamp) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 8;
  }

  // Separator line
  doc.setDrawColor(200);
  doc.line(margin, y, margin + width, y);
  y += 10;

  doc.setTextColor(0);
  return y;
}

/**
 * Add search information section
 */
function addSearchInfo(
  doc: jsPDF,
  query: string,
  filters: any,
  y: number,
  width: number
): number {
  const margin = 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Search Criteria', margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Query
  doc.text(`Query: "${query}"`, margin + 5, y);
  y += 6;

  // Date range
  if (filters?.dateFrom || filters?.dateTo) {
    const from = filters.dateFrom
      ? new Date(filters.dateFrom).toLocaleDateString()
      : 'Any';
    const to = filters.dateTo
      ? new Date(filters.dateTo).toLocaleDateString()
      : 'Any';
    doc.text(`Date Range: ${from} - ${to}`, margin + 5, y);
    y += 6;
  }

  // Sentiment filter
  if (filters?.sentiment) {
    doc.text(`Sentiment: ${filters.sentiment}`, margin + 5, y);
    y += 6;
  }

  // Domain filter
  if (filters?.domainName) {
    doc.text(`Domain: ${filters.domainName}`, margin + 5, y);
    y += 6;
  }

  y += 5;
  return y;
}

/**
 * Add summary statistics
 */
function addSummary(
  doc: jsPDF,
  results: SearchResult[],
  y: number,
  width: number
): number {
  const margin = 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Total results
  doc.text(`Total Results: ${results.length}`, margin + 5, y);
  y += 6;

  // Unique conversations
  const uniqueConversations = new Set(results.map(r => r.conversationId)).size;
  doc.text(`Unique Conversations: ${uniqueConversations}`, margin + 5, y);
  y += 6;

  // Sentiment breakdown
  const sentiments = { positive: 0, negative: 0, neutral: 0 };
  results.forEach(r => {
    const sentiment = r.sentiment || 'neutral';
    sentiments[sentiment as keyof typeof sentiments]++;
  });

  doc.text(
    `Sentiment: ${sentiments.positive} positive, ${sentiments.negative} negative, ${sentiments.neutral} neutral`,
    margin + 5,
    y
  );
  y += 10;

  return y;
}

/**
 * Add search results
 */
function addResults(
  doc: jsPDF,
  results: SearchResult[],
  startY: number,
  width: number,
  pageHeight: number,
  margin: number
): number {
  let y = startY;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Search Results', margin, y);
  y += 10;

  // Group results by conversation
  const conversations = groupByConversation(results);

  for (const [convId, messages] of conversations.entries()) {
    // Check if we need a new page
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }

    // Conversation header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);

    const firstMsg = messages[0];
    const convHeader = `Conversation: ${convId.substring(0, 8)}...`;
    doc.text(convHeader, margin, y);
    y += 6;

    // Customer info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);

    const customerInfo = [];
    if (firstMsg.customerEmail) {
      customerInfo.push(`Customer: ${firstMsg.customerEmail}`);
    }
    if (firstMsg.domainName) {
      customerInfo.push(`Domain: ${firstMsg.domainName}`);
    }

    if (customerInfo.length > 0) {
      doc.text(customerInfo.join(' | '), margin + 5, y);
      y += 6;
    }

    // Messages
    doc.setTextColor(0);
    for (const msg of messages) {
      // Check for new page
      if (y > pageHeight - 30) {
        doc.addPage();
        y = margin;
      }

      y = addMessage(doc, msg, y, width, margin);
    }

    y += 5; // Space between conversations
  }

  return y;
}

/**
 * Add a single message
 */
function addMessage(
  doc: jsPDF,
  message: SearchResult,
  y: number,
  width: number,
  margin: number
): number {
  // Message header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  const timestamp = new Date(message.createdAt).toLocaleString();
  const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);

  // Color-code by role
  if (message.role === 'user') {
    doc.setTextColor(0, 102, 204);
  } else if (message.role === 'assistant') {
    doc.setTextColor(0, 153, 0);
  } else {
    doc.setTextColor(100);
  }

  doc.text(`${role} - ${timestamp}`, margin + 5, y);
  y += 5;

  // Message content
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.setFontSize(9);

  // Strip HTML and truncate
  const content = stripHtml(message.highlight || message.content);
  const lines = doc.splitTextToSize(content, width - 10);
  const maxLines = 5;

  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    doc.text(lines[i], margin + 5, y);
    y += 4;
  }

  if (lines.length > maxLines) {
    doc.setTextColor(150);
    doc.text('...', margin + 5, y);
    y += 4;
  }

  // Relevance score
  if (message.relevanceScore > 0) {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Relevance: ${(message.relevanceScore * 100).toFixed(1)}%`, margin + 5, y);
    y += 5;
  }

  return y + 3;
}

/**
 * Group results by conversation
 */
function groupByConversation(
  results: SearchResult[]
): Map<string, SearchResult[]> {
  const grouped = new Map<string, SearchResult[]>();

  for (const result of results) {
    const messages = grouped.get(result.conversationId) || [];
    messages.push(result);
    grouped.set(result.conversationId, messages);
  }

  // Sort messages within each conversation
  grouped.forEach(messages => {
    messages.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });

  return grouped;
}

/**
 * Add page numbers
 */
function addPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

/**
 * Strip HTML tags
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Generate a detailed conversation report PDF
 */
export function generateConversationReport(
  conversationId: string,
  messages: SearchResult[],
  metadata?: any
): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Conversation Transcript', margin, yPosition);
  yPosition += 10;

  // Conversation ID
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Conversation ID: ${conversationId}`, margin, yPosition);
  yPosition += 6;

  // Metadata
  if (metadata) {
    if (metadata.customerEmail) {
      doc.text(`Customer: ${metadata.customerEmail}`, margin, yPosition);
      yPosition += 5;
    }
    if (metadata.domain) {
      doc.text(`Domain: ${metadata.domain}`, margin, yPosition);
      yPosition += 5;
    }
    if (metadata.startTime) {
      doc.text(`Started: ${new Date(metadata.startTime).toLocaleString()}`, margin, yPosition);
      yPosition += 5;
    }
  }

  yPosition += 5;

  // Separator
  doc.setDrawColor(200);
  doc.line(margin, yPosition, margin + contentWidth, yPosition);
  yPosition += 10;

  // Messages
  doc.setTextColor(0);
  for (const message of messages) {
    // Check for new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Message timestamp and role
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    const timestamp = new Date(message.createdAt).toLocaleString();
    const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);

    // Color by role
    if (message.role === 'user') {
      doc.setTextColor(0, 102, 204);
    } else if (message.role === 'assistant') {
      doc.setTextColor(0, 153, 0);
    } else {
      doc.setTextColor(100);
    }

    doc.text(`${role} - ${timestamp}`, margin, yPosition);
    yPosition += 6;

    // Message content (full)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.setFontSize(9);

    const lines = doc.splitTextToSize(message.content, contentWidth);
    for (const line of lines) {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4;
    }

    yPosition += 6; // Space between messages
  }

  // Add page numbers
  addPageNumbers(doc);

  return doc.output('arraybuffer') as Uint8Array;
}