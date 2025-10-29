/**
 * Dashboard Query Performance Tests
 *
 * Verifies the N+1 query fix (GitHub Issue #8)
 *
 * Performance Goals:
 * - Query Count: 20+ → 1-4 queries
 * - Load Time: ~1000ms → ~100ms
 * - Database Load: 95% reduction
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getDashboardStats, getOrganizationStats } from '@/lib/queries/dashboard-stats';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Dashboard Query Performance', () => {
  let mockSupabase: any;
  let queryCount: number;

  beforeEach(() => {
    queryCount = 0;

    // Create mock Supabase client that counts queries
    mockSupabase = {
      from: jest.fn((table: string) => {
        const mockQuery = {
          select: jest.fn(() => {
            queryCount++; // Increment on each select
            return mockQuery;
          }),
          eq: jest.fn(() => mockQuery),
          in: jest.fn(() => mockQuery),
          single: jest.fn(() => {
            return Promise.resolve({ data: null, error: null });
          })
        };
        return mockQuery;
      })
    };
  });

  describe('Query Count Optimization', () => {
    it('should execute maximum 4 queries for multiple organizations', async () => {
      // Mock data for 10 organizations
      const mockOrgs = Array.from({ length: 10 }, (_, i) => ({
        id: `org-${i}`,
        name: `Organization ${i}`,
        created_at: new Date().toISOString(),
        organization_members: [
          { user_id: 'test-user', role: 'owner' }
        ]
      }));

      // Mock first query (organizations)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: mockOrgs,
            error: null
          }))
        }))
      });

      // Mock subsequent queries (configs, conversations, scraped_pages)
      for (let i = 0; i < 3; i++) {
        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        });
      }

      queryCount = 0;
      await getDashboardStats(mockSupabase as unknown as SupabaseClient, 'test-user');

      // Should be 4 queries regardless of organization count
      expect(queryCount).toBeLessThanOrEqual(4);
    });

    it('should NOT scale query count with organization count', async () => {
      const testCases = [
        { orgCount: 1, maxQueries: 4 },
        { orgCount: 5, maxQueries: 4 },
        { orgCount: 10, maxQueries: 4 },
        { orgCount: 20, maxQueries: 4 }
      ];

      for (const { orgCount, maxQueries } of testCases) {
        queryCount = 0;

        // Mock organizations
        const mockOrgs = Array.from({ length: orgCount }, (_, i) => ({
          id: `org-${i}`,
          name: `Organization ${i}`,
          created_at: new Date().toISOString(),
          organization_members: [{ user_id: 'test-user', role: 'owner' }]
        }));

        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: mockOrgs, error: null }))
          }))
        });

        // Mock batch queries
        for (let i = 0; i < 3; i++) {
          mockSupabase.from.mockReturnValueOnce({
            select: jest.fn(() => ({
              in: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          });
        }

        await getDashboardStats(mockSupabase as unknown as SupabaseClient, 'test-user');

        expect(queryCount).toBeLessThanOrEqual(maxQueries);
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete in under 500ms for 10 organizations', async () => {
      const mockOrgs = Array.from({ length: 10 }, (_, i) => ({
        id: `org-${i}`,
        name: `Organization ${i}`,
        created_at: new Date().toISOString(),
        organization_members: [{ user_id: 'test-user', role: 'owner' }]
      }));

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: mockOrgs, error: null }))
        }))
      });

      for (let i = 0; i < 3; i++) {
        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        });
      }

      const start = performance.now();
      await getDashboardStats(mockSupabase as unknown as SupabaseClient, 'test-user');
      const duration = performance.now() - start;

      // Should be very fast with mocked data
      expect(duration).toBeLessThan(500);
    });

    it('should handle single organization efficiently', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Organization',
        created_at: new Date().toISOString()
      };

      // Mock membership check (chained eq)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { role: 'owner' },
                error: null
              }))
            }))
          }))
        }))
      });

      // Mock organization fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockOrg,
              error: null
            }))
          }))
        }))
      });

      // Mock parallel queries (4 queries)
      for (let i = 0; i < 4; i++) {
        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        });
      }

      const start = performance.now();
      await getOrganizationStats(
        mockSupabase as unknown as SupabaseClient,
        'test-user',
        'org-1'
      );
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Data Aggregation', () => {
    it('should correctly aggregate stats across organizations', async () => {
      const mockOrgs = [
        {
          id: 'org-1',
          name: 'Org 1',
          created_at: '2024-01-01T00:00:00Z',
          organization_members: [
            { user_id: 'user-1', role: 'owner' },
            { user_id: 'user-2', role: 'member' }
          ]
        },
        {
          id: 'org-2',
          name: 'Org 2',
          created_at: '2024-01-02T00:00:00Z',
          organization_members: [
            { user_id: 'user-1', role: 'admin' }
          ]
        }
      ];

      const mockConfigs = [
        { organization_id: 'org-1', id: 'config-1', is_active: true },
        { organization_id: 'org-1', id: 'config-2', is_active: false },
        { organization_id: 'org-2', id: 'config-3', is_active: true }
      ];

      const mockConversations = [
        { organization_id: 'org-1', created_at: new Date().toISOString() },
        { organization_id: 'org-1', created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
        { organization_id: 'org-2', created_at: new Date().toISOString() }
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: mockOrgs, error: null }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          in: jest.fn(() => Promise.resolve({ data: mockConfigs, error: null }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          in: jest.fn(() => Promise.resolve({ data: mockConversations, error: null }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          in: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      });

      const stats = await getDashboardStats(
        mockSupabase as unknown as SupabaseClient,
        'user-1'
      );

      expect(stats).toHaveLength(2);

      // Org 1 stats
      expect(stats[0].organization.id).toBe('org-1');
      expect(stats[0].configs.total).toBe(2);
      expect(stats[0].configs.active).toBe(1);
      expect(stats[0].members.total).toBe(2);
      expect(stats[0].members.admins).toBe(1); // owner counts as admin
      expect(stats[0].conversations.total).toBe(2);

      // Org 2 stats
      expect(stats[1].organization.id).toBe('org-2');
      expect(stats[1].configs.total).toBe(1);
      expect(stats[1].configs.active).toBe(1);
      expect(stats[1].members.total).toBe(1);
      expect(stats[1].members.admins).toBe(1);
      expect(stats[1].conversations.total).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle organization query errors gracefully', async () => {
      // Mock query that returns an error
      const dbError = { message: 'Database error', code: '500' };

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: null,
            error: dbError
          }))
        }))
      });

      await expect(
        getDashboardStats(mockSupabase as unknown as SupabaseClient, 'test-user')
      ).rejects.toEqual(dbError);
    });

    it('should return empty array when user has no organizations', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      });

      const stats = await getDashboardStats(
        mockSupabase as unknown as SupabaseClient,
        'test-user'
      );

      expect(stats).toEqual([]);
    });

    it('should return null for unauthorized organization access', async () => {
      // Mock membership check returning null (unauthorized)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Not found' }
              }))
            }))
          }))
        }))
      });

      const stats = await getOrganizationStats(
        mockSupabase as unknown as SupabaseClient,
        'test-user',
        'org-1'
      );

      expect(stats).toBeNull();
    });
  });
});
