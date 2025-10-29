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

describe('UserMenu Component - Auth State Changes', () => {
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

  describe('Auth State Change Listening', () => {
    it('should listen to auth state changes on mount', () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<UserMenu />);

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should update user when auth state changes to signed in', async () => {
      const unsubscribe = jest.fn();
      let authCallback: any;

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe,
            },
          },
        };
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      // Simulate auth state change to signed in
      authCallback('SIGNED_IN', {
        user: {
          id: 'user-123',
          email: 'new@example.com',
        },
      });

      await waitFor(() => {
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      });
    });

    it('should handle null session in auth state change', async () => {
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
          },
        },
        error: null,
      });

      render(<UserMenu />);

      // Simulate sign out via auth state change
      authCallback('SIGNED_OUT', null);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });
    });

    it('should unsubscribe from auth changes on unmount', () => {
      const unsubscribe = jest.fn();

      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: {
          subscription: {
            unsubscribe,
          },
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { unmount } = render(<UserMenu />);

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('User Data Updates', () => {
    it('should update display when user metadata changes', async () => {
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

      const { user } = render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Open menu and check initial state
      await user.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });

      // Close menu
      await user.click(screen.getByRole('button'));

      // Simulate user metadata update
      authCallback('USER_UPDATED', {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'John Doe',
          },
        },
      });

      // Open menu and verify updated name
      await user.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });
});
