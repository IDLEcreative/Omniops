import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@/__tests__/utils/test-utils';
import { UserMenu } from '@/components/auth/user-menu';
import { createBrowserClient } from '@supabase/ssr';

// Access global router mocks from jest.setup.js
const mockPush = (global as any).mockRouterPush;
const mockRefresh = (global as any).mockRouterRefresh;

// Mock Supabase client
const mockCreateBrowserClient = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

describe('UserMenu Component - Interactions', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Clear mock call history
    mockPush.mockClear();
    mockRefresh.mockClear();

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

      // Wait for dropdown menu to appear
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });

      // Use fireEvent for menu item click (Radix UI dropdowns work better with this)
      const profileItem = screen.getByText('Profile');
      fireEvent.click(profileItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile');
      }, { timeout: 3000 });
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

      // Wait for dropdown menu to appear
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Use fireEvent for menu item click
      const settingsItem = screen.getByText('Settings');
      fireEvent.click(settingsItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/settings');
      }, { timeout: 3000 });
    });
  });

  describe('Sign Out Actions', () => {
    it('should call signOut when Sign out is clicked', async () => {
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

      await waitFor(() => {
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      // Wait for dropdown menu to appear
      await waitFor(() => {
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });

      // Use fireEvent for menu item click
      const signOutItem = screen.getByText('Sign out');
      fireEvent.click(signOutItem);

      // Verify all related calls happened (sign out triggers navigation too)
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
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

      // Wait for dropdown menu to appear
      await waitFor(() => {
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });

      // Use fireEvent for menu item click
      const signOutItem = screen.getByText('Sign out');
      fireEvent.click(signOutItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
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

      // Wait for dropdown menu to appear
      await waitFor(() => {
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });

      // Use fireEvent for menu item click
      const signOutItem = screen.getByText('Sign out');
      fireEvent.click(signOutItem);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });
});
