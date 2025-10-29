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

describe('UserMenu Component - Interactions', () => {
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

  describe('Sign In Navigation', () => {
    it('should navigate to login page when Sign In is clicked', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { user } = render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sign In'));

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Menu Navigation', () => {
    it('should navigate to profile when Profile is clicked', async () => {
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
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      const profileItem = screen.getByText('Profile');
      await user.click(profileItem);

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('should navigate to settings when Settings is clicked', async () => {
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
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      const settingsItem = screen.getByText('Settings');
      await user.click(settingsItem);

      expect(mockPush).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Sign Out Actions', () => {
    it('should call signOut when Sign out is clicked', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
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
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      const signOutItem = screen.getByText('Sign out');
      await user.click(signOutItem);

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      });
    });

    it('should navigate to login page after sign out', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
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
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      const signOutItem = screen.getByText('Sign out');
      await user.click(signOutItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should refresh router after sign out', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
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
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      const signOutItem = screen.getByText('Sign out');
      await user.click(signOutItem);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });
});
