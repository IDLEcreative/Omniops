import { jsPDF } from 'jspdf';
import { SearchResult } from '@/lib/search/conversation-search';
import { addPageNumbers } from './pdf-sections/page-numbers';

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

  return new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
}
