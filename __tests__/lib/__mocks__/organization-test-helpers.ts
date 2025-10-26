import { jest } from '@jest/globals';

/**
 * Creates a mock Supabase client for organization testing
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis()
    }))
  };
}

/**
 * Mock response helpers for organization membership tests
 */
export const mockResponses = {
  member: (role: string) => ({
    data: { role },
    error: null
  }),

  noMember: () => ({
    data: null,
    error: null
  }),

  error: (message: string) => ({
    data: null,
    error: { message }
  }),

  organization: (seat_limit: number, plan_type?: string) => ({
    data: { seat_limit, plan_type },
    error: null
  }),

  count: (count: number) => ({
    count,
    error: null
  })
};

/**
 * Setup helpers for common test scenarios
 */
export const testScenarios = {
  setupSeats: (
    mockSupabase: any,
    seatLimit: number,
    activeMembers: number,
    pendingInvites: number,
    planType?: string
  ) => {
    mockSupabase.from().single.mockResolvedValueOnce(
      mockResponses.organization(seatLimit, planType)
    );
    mockSupabase.from().count.mockResolvedValueOnce(
      mockResponses.count(activeMembers)
    );
    mockSupabase.from().count.mockResolvedValueOnce(
      mockResponses.count(pendingInvites)
    );
  },

  setupUnlimitedSeats: (mockSupabase: any, activeMembers: number, pendingInvites: number) => {
    mockSupabase.from().single.mockResolvedValueOnce(
      mockResponses.organization(-1, 'enterprise')
    );
    mockSupabase.from().count.mockResolvedValueOnce(
      mockResponses.count(activeMembers)
    );
    mockSupabase.from().count.mockResolvedValueOnce(
      mockResponses.count(pendingInvites)
    );
  }
};
