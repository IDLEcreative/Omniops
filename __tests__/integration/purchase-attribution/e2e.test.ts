/**
 * Purchase Attribution E2E Integration Test
 *
 * Tests the complete flow: Order webhook → Attribution → Analytics
 */

import { createMocks } from 'node-mocks-http';
import { POST as woocommerceWebhook } from '@/app/api/webhooks/woocommerce/order-created/route';
import crypto from 'crypto';
import * as attributionDb from '@/lib/attribution/attribution-db';

// Mock Supabase
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'domain-1',
              domain: 'test-store.com',
              encrypted_credentials: {
                woocommerce_webhook_secret: 'test-secret',
              },
            },
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'attr-1' },
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          error: null,
        })),
      })),
      upsert: jest.fn(() => ({
        error: null,
      })),
    })),
  })),
}));

// Mock attribution database
jest.mock('@/lib/attribution/attribution-db', () => ({
  getActiveSessionByEmail: jest.fn(() =>
    Promise.resolve({
      sessionId: 'sess_test',
      conversationId: 'conv_test',
      lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    })
  ),
  savePurchaseAttribution: jest.fn(() => Promise.resolve({ id: 'attr_test' })),
  linkEmailToSession: jest.fn(() => Promise.resolve()),
  getCustomerMetrics: jest.fn(() =>
    Promise.resolve({
      isReturningCustomer: false,
      totalConversations: 1,
      totalPurchases: 0,
      lifetimeValue: 0,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    })
  ),
}));

describe('Purchase Attribution E2E', () => {
  it('should complete full attribution flow for WooCommerce order', async () => {
    // 1. Create webhook payload
    const orderPayload = {
      id: 12345,
      number: 'WC-12345',
      status: 'completed',
      total: '299.99',
      currency: 'USD',
      billing: {
        first_name: 'Test',
        last_name: 'Customer',
        email: 'customer@example.com',
      },
      line_items: [
        {
          id: 1,
          name: 'Test Product',
          product_id: 100,
          quantity: 1,
          total: '299.99',
        },
      ],
      date_created_gmt: new Date().toISOString(),
    };

    const rawBody = JSON.stringify(orderPayload);

    // 2. Generate valid signature
    const signature = crypto
      .createHmac('sha256', 'test-secret')
      .update(rawBody)
      .digest('base64');

    // 3. Create mock request
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-wc-webhook-signature': signature,
        'x-wc-webhook-topic': 'order.created',
        'x-wc-webhook-source': 'https://test-store.com',
      },
      body: orderPayload,
    });

    // Make request object readable as text
    const mockRequest = {
      ...req,
      text: async () => rawBody,
      headers: new Headers({
        'x-wc-webhook-signature': signature,
        'x-wc-webhook-topic': 'order.created',
        'x-wc-webhook-source': 'https://test-store.com',
      }),
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    } as any;

    // 4. Send webhook
    const response = await woocommerceWebhook(mockRequest);
    const data = await response.json();

    // 5. Verify response
    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.attribution).toBeDefined();
    expect(data.attribution.conversationId).toBe('conv_test');
    expect(data.attribution.confidence).toBeGreaterThan(0.85);
    expect(data.attribution.method).toBe('session_match');
  });

  it('should handle attribution failure gracefully', async () => {
    // Mock attribution to throw error
    const savePurchaseAttribution = jest.mocked(attributionDb.savePurchaseAttribution);
    savePurchaseAttribution.mockRejectedValueOnce(new Error('Database error'));

    const orderPayload = {
      id: 99999,
      number: 'WC-99999',
      status: 'completed',
      total: '99.99',
      currency: 'USD',
      billing: {
        first_name: 'Test',
        last_name: 'Error',
        email: 'error@example.com',
      },
      line_items: [],
      date_created_gmt: new Date().toISOString(),
    };

    const rawBody = JSON.stringify(orderPayload);
    const signature = crypto
      .createHmac('sha256', 'test-secret')
      .update(rawBody)
      .digest('base64');

    const mockRequest = {
      text: async () => rawBody,
      headers: new Headers({
        'x-wc-webhook-signature': signature,
        'x-wc-webhook-topic': 'order.created',
        'x-wc-webhook-source': 'https://test-store.com',
      }),
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    } as any;

    const response = await woocommerceWebhook(mockRequest);
    const data = await response.json();

    // Should return 200 to prevent webhook retries
    expect(response.status).toBe(200);
    expect(data.status).toBe('error');
    expect(data.error).toBe('Attribution failed');
  });
});
