import { jsPDF } from 'jspdf';
import { SearchResult } from '@/lib/search/conversation-search';

/**
 * Add summary statistics section to PDF
 */
export function addSummary(
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
