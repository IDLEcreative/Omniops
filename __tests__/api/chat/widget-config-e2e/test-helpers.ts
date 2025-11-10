/**
 * Helper functions for widget config E2E tests
 */

import { NextRequest } from 'next/server';
import { jest } from '@jest/globals';

export function setupMockDatabase(
  mockSupabase: any,
  config: {
    domainId: string;
    customerConfigId: string;
    widgetConfig: any;
  }
) {
  mockSupabase.single
    // Domain lookup
    .mockResolvedValueOnce({
      data: { id: config.domainId },
      error: null
    })
    // Customer config lookup
    .mockResolvedValueOnce({
      data: { customer_config_id: config.customerConfigId },
      error: null
    })
    // Domain metadata lookup for profile context
    .mockResolvedValueOnce({
      data: {
        domain: 'test-domain.com',
        name: 'Test Domain',
        description: 'Test description',
        customer_config_id: config.customerConfigId
      },
      error: null
    })
    // Widget config lookup
    .mockResolvedValueOnce({
      data: { config_data: config.widgetConfig },
      error: null
    })
    // Customer profile lookup
    .mockResolvedValueOnce({
      data: {
        business_name: 'Test Domain',
        business_description: 'Test description'
      },
      error: null
    })
    // Conversation creation/lookup
    .mockResolvedValue({
      data: { id: 'test-conversation-id', metadata: {} },
      error: null
    });

  // Mock insert/update operations
  mockSupabase.insert.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: 'test-id' },
      error: null
    })
  });

  mockSupabase.update.mockReturnValue({
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue({ data: {}, error: null })
  });
}

export function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: () => null
    }
  } as any;
}

export function createMockSupabase() {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn()
  };
}

export function createMockDeps(mockSupabase: any) {
  return {
    createServiceRoleClient: async () => mockSupabase,
    checkDomainRateLimit: () => ({ allowed: true, resetTime: Date.now() }),
    searchSimilarContent: jest.fn().mockResolvedValue([]),
    getCommerceProvider: jest.fn(),
    sanitizeOutboundLinks: (text: string) => text
  };
}
