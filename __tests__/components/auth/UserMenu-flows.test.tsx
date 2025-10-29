import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import { UserMenu } from '@/components/auth/user-menu';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
const mockCreateBrowserClient = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: mockCreateBrowserClient,
}));

// Mock Next.js navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
}));

describe('UserMenu Component - Full Authentication Flows', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
        signOut: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        })),
      },
    };

    mockCreateBrowserClient.mockReturnValue(mockSupabaseClient);
  });

  describe('Complete Sign In Flow', () => {
    it('should handle complete sign in flow', async () => {
      let authCallback: any;

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { user } = render(<UserMenu />);

      // Initial state - should show Sign In button
      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      // Click Sign In button
      await user.click(screen.getByText('Sign In'));
      expect(mockPush).toHaveBeenCalledWith('/login');

      // Simulate successful sign in
      authCallback('SIGNED_IN', {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {},
        },
      });

      // Should now show avatar
      await waitFor(() => {
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });

  describe('Complete Sign Out Flow', () => {
    it('should handle complete sign out flow', async () => {
      let authCallback: any;

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: {},
          },
        },
        error: null,
      });

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const { user } = render(<UserMenu />);

      // Should show avatar initially
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Click avatar to open menu
      await user.click(screen.getByRole('button'));

      // Click sign out
      const signOutItem = screen.getByText('Sign out');
      await user.click(signOutItem);

      // Verify sign out was called
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/login');
        expect(mockRefresh).toHaveBeenCalled();
      });

      // Simulate auth state change
      authCallback('SIGNED_OUT', null);

      // Should show Sign In button again
      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });
    });
  });
});
