import { jsPDF } from 'jspdf';
import { SearchResult } from '@/lib/search/conversation-search';
import { stripHtml } from '../pdf-utils';

/**
 * Add a single message to PDF
 */
export function addMessage(
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
