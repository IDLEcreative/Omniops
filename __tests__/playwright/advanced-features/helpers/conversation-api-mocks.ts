import { Page } from '@playwright/test';

export interface Conversation {
  id: string;
  customer_name: string;
  customer_email: string;
  status: 'active' | 'resolved' | 'archived';
  created_at: string;
  message_count: number;
  last_message: string;
}

/**
 * Mock conversations API
 */
export async function mockConversationsAPI(page: Page, conversations: Conversation[]): Promise<void> {
  console.log('🔧 Setting up conversations API mock');

  await page.route('**/api/conversations**', async (route) => {
    const url = route.request().url();
    const urlObj = new URL(url);

    // Handle filtering
    const status = urlObj.searchParams.get('status');
    const search = urlObj.searchParams.get('search');
    const startDate = urlObj.searchParams.get('start_date');
    const endDate = urlObj.searchParams.get('end_date');

    let filtered = [...conversations];

    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.customer_name.toLowerCase().includes(searchLower) ||
        c.customer_email.toLowerCase().includes(searchLower) ||
        c.last_message.toLowerCase().includes(searchLower)
      );
    }

    if (startDate) {
      filtered = filtered.filter(c => new Date(c.created_at) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter(c => new Date(c.created_at) <= new Date(endDate));
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        conversations: filtered,
        total: filtered.length,
        page: 1,
        per_page: 20
      })
    });
  });

  console.log('✅ Conversations API mock ready');
}

/**
 * Mock conversation details API
 */
export async function mockConversationDetailsAPI(page: Page, conversation: Conversation): Promise<void> {
  console.log('🔧 Setting up conversation details API mock');

  await page.route(`**/api/conversations/${conversation.id}`, async (route) => {
    const messages = [
      {
        id: '1',
        role: 'user',
        content: 'Hello, I need help with my order',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        role: 'assistant',
        content: 'I would be happy to help you with your order. Could you please provide your order number?',
        timestamp: new Date(Date.now() - 3500000).toISOString()
      },
      {
        id: '3',
        role: 'user',
        content: 'My order number is #12345',
        timestamp: new Date(Date.now() - 3400000).toISOString()
      },
      {
        id: '4',
        role: 'assistant',
        content: 'Thank you. Let me look up your order #12345. Your order is currently being processed and will ship within 2-3 business days.',
        timestamp: new Date(Date.now() - 3300000).toISOString()
      }
    ];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        conversation: {
          ...conversation,
          messages
        }
      })
    });
  });

  console.log('✅ Conversation details API mock ready');
}

/**
 * Mock conversation export API
 */
export async function mockConversationExportAPI(page: Page): Promise<{ getExportData: () => any }> {
  console.log('🔧 Setting up conversation export API mock');

  const exportState = { exportData: null as any };

  await page.route('**/api/conversations/export**', async (route) => {
    const exportFormat = route.request().url().includes('format=csv') ? 'csv' : 'json';

    exportState.exportData = {
      format: exportFormat,
      timestamp: new Date().toISOString(),
      recordCount: 10
    };

    const csvContent = 'id,customer_name,customer_email,status,created_at,message_count\n' +
      '1,John Doe,john@example.com,resolved,2025-01-01,4\n' +
      '2,Jane Smith,jane@example.com,active,2025-01-02,2\n';

    await route.fulfill({
      status: 200,
      contentType: exportFormat === 'csv' ? 'text/csv' : 'application/json',
      headers: {
        'Content-Disposition': `attachment; filename="conversations-export-${Date.now()}.${exportFormat}"`
      },
      body: exportFormat === 'csv' ? csvContent : JSON.stringify({ conversations: [] })
    });
  });

  console.log('✅ Conversation export API mock ready');
  return {
    getExportData: () => exportState.exportData
  };
}

export const mockConversationData: Conversation[] = [
  {
    id: 'conv-1',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    status: 'resolved',
    created_at: '2025-01-15T10:00:00Z',
    message_count: 4,
    last_message: 'Thank you for your help!'
  },
  {
    id: 'conv-2',
    customer_name: 'Jane Smith',
    customer_email: 'jane@example.com',
    status: 'active',
    created_at: '2025-01-16T14:30:00Z',
    message_count: 2,
    last_message: 'I need assistance with shipping'
  },
  {
    id: 'conv-3',
    customer_name: 'Bob Johnson',
    customer_email: 'bob@example.com',
    status: 'active',
    created_at: '2025-01-17T09:15:00Z',
    message_count: 6,
    last_message: 'When will my order arrive?'
  },
  {
    id: 'conv-4',
    customer_name: 'Alice Williams',
    customer_email: 'alice@example.com',
    status: 'archived',
    created_at: '2025-01-10T16:45:00Z',
    message_count: 3,
    last_message: 'Problem resolved, thanks!'
  }
];
