/**
 * Shared Test Helpers for Conversation Actions API
 *
 * Common mock setup and utilities for testing conversation actions.
 */

import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';

export const TEST_IDS = {
  conversationId: '550e8400-e29b-41d4-a716-446655440000',
  userId: 'user-123',
  domainId: 'domain-456',
  orgId: 'org-789',
} as const;

export const createMockRequest = (body: object) => {
  return new NextRequest('http://localhost:3000/api/dashboard/conversations/test/actions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
};

export const setupAuthenticatedMocks = () => {
  const userSupabase = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: TEST_IDS.userId } },
        error: null,
      }),
    },
    from: jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { organization_id: TEST_IDS.orgId },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };

  const serviceSupabase = {
    from: jest.fn((table: string) => {
      if (table === 'conversations') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
          update: jest.fn().mockReturnThis(),
        };
      }
      if (table === 'customer_configs') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };

  return { userSupabase, serviceSupabase };
};

export const mockConversationData = (overrides = {}) => ({
  id: TEST_IDS.conversationId,
  domain_id: TEST_IDS.domainId,
  metadata: { status: 'active' },
  ...overrides,
});

export const mockCustomerConfigData = (overrides = {}) => ({
  id: TEST_IDS.domainId,
  ...overrides,
});
