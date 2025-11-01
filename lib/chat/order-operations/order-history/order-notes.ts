/**
 * Get order notes operation
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  OrderNoteInfo
} from './types';

/**
 * Get order notes
 * Retrieves all notes (customer-facing and internal) for an order
 */
export async function getOrderNotes(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.orderId) {
    return {
      success: false,
      data: null,
      message: "Order ID is required for order notes"
    };
  }

  try {
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
      return {
        success: false,
        data: null,
        message: "Invalid order ID format"
      };
    }

    // First verify the order exists
    let order;
    try {
      order = await wc.getOrder(orderId);
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Order #${orderId} not found`
      };
    }

    // Get order notes
    const notes = await wc.getOrderNotes(orderId);

    if (notes && notes.length > 0) {
      const noteList: OrderNoteInfo[] = notes.map((note: any) => ({
        id: note.id,
        author: note.author || 'System',
        dateCreated: note.date_created,
        note: note.note,
        customerNote: note.customer_note
      }));

      // Separate customer notes from internal notes
      const customerNotes = noteList.filter(n => n.customerNote);
      const internalNotes = noteList.filter(n => !n.customerNote);

      // Build message
      let message = `📝 Order Notes for Order #${orderId}\n\n`;
      message += `Order Status: ${order.status}\n`;
      message += `Total Notes: ${noteList.length} (${customerNotes.length} customer-facing, ${internalNotes.length} internal)\n\n`;

      // Show customer-facing notes first
      if (customerNotes.length > 0) {
        message += `👤 Customer-Facing Notes (${customerNotes.length}):\n\n`;
        customerNotes.forEach((note, index) => {
          const date = new Date(note.dateCreated).toLocaleDateString();
          const time = new Date(note.dateCreated).toLocaleTimeString();

          message += `${index + 1}. ${note.author} - ${date} at ${time}\n`;
          message += `   ${note.note}\n\n`;
        });
      }

      // Show internal notes
      if (internalNotes.length > 0) {
        message += `🔒 Internal Notes (${internalNotes.length}):\n\n`;
        internalNotes.forEach((note, index) => {
          const date = new Date(note.dateCreated).toLocaleDateString();
          const time = new Date(note.dateCreated).toLocaleTimeString();

          message += `${index + 1}. ${note.author} - ${date} at ${time}\n`;
          message += `   ${note.note}\n\n`;
        });
      }

      return {
        success: true,
        data: {
          notes: noteList,
          customerNotes,
          internalNotes
        },
        message
      };
    } else {
      return {
        success: true,
        data: {
          notes: [],
          customerNotes: [],
          internalNotes: []
        },
        message: `No notes found for Order #${orderId}\n\nOrder Status: ${order.status}`
      };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Order notes error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve order notes"
    };
  }
}
