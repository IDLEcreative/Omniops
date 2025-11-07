/**
 * Test Helpers for Organization API Tests
 */

import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';

export const buildRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

/**
 * Mock builder for organizations table
 */
export function mockOrganizationsTable(options: {
  existingSlug?: boolean;
  orgData?: any;
  insertError?: any;
}) {
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: options.existingSlug ? { slug: 'existing-org' } : null,
          error: null,
        }),
      }),
    }),
    insert: jest.fn((data?: any) => {
      const capturedData = data;
      return {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: options.insertError ? null : (options.orgData || capturedData),
            error: options.insertError || null,
          }),
        }),
      };
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn(() => Promise.resolve({ error: null })),
    }),
  };
}

/**
 * Mock builder for organization_members table
 */
export function mockMembersTable(options: {
  insertError?: any;
  captureData?: (data: any) => void;
}) {
  return {
    insert: jest.fn((data: any) => {
      if (options.captureData) {
        options.captureData(data);
      }
      return Promise.resolve({
        error: options.insertError || null,
      });
    }),
  };
}

/**
 * Create a complete mock client with organization and member tables
 */
export function createMockClientWithTables(config: {
  existingSlug?: boolean;
  orgData?: any;
  orgInsertError?: any;
  memberInsertError?: any;
  captureMemberData?: (data: any) => void;
  captureOrgData?: (data: any) => void;
}) {
  return (table: string) => {
    if (table === 'organizations') {
      const mock = mockOrganizationsTable({
        existingSlug: config.existingSlug,
        orgData: config.orgData,
        insertError: config.orgInsertError,
      });

      // Override insert if we need to capture data
      if (config.captureOrgData) {
        const originalInsert = mock.insert;
        mock.insert = jest.fn((data: any) => {
          config.captureOrgData!(data);
          return originalInsert(data);
        });
      }

      return mock;
    }

    if (table === 'organization_members') {
      return mockMembersTable({
        insertError: config.memberInsertError,
        captureData: config.captureMemberData,
      });
    }

    // Default table mock
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  };
}

/**
 * Response assertion helpers
 */
export const assertResponse = {
  isUnauthorized: (status: number, data: any) => {
    expect(status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  },

  isCreated: (status: number, data: any, expectedOrg?: Partial<any>) => {
    expect(status).toBe(201);
    expect(data.organization).toBeDefined();
    if (expectedOrg) {
      expect(data.organization).toMatchObject(expectedOrg);
    }
  },

  isBadRequest: (status: number, data: any) => {
    expect(status).toBe(400);
    expect(data.error).toBe('Invalid request');
  },

  isConflict: (status: number, data: any) => {
    expect(status).toBe(409);
    expect(data.error).toBe('Organization slug already exists');
  },

  isServerError: (status: number, data: any, errorMessage?: string) => {
    expect(status).toBe(500);
    if (errorMessage) {
      expect(data.error).toBe(errorMessage);
    }
  },

  isServiceUnavailable: (status: number, data: any) => {
    expect(status).toBe(503);
    expect(data.error).toBe('Service unavailable');
  },
};
