import { jsPDF } from 'jspdf';
import { SearchResult } from '@/lib/search/conversation-search';
import { addMessage } from './message';
import { groupByConversation } from '../pdf-utils';

/**
 * Add search results section to PDF
 */
export function addResults(
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
    if (firstMsg?.customerEmail) {
      customerInfo.push(`Customer: ${firstMsg.customerEmail}`);
    }
    if (firstMsg?.domainName) {
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
