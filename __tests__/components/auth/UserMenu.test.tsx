import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import { UserMenu } from '@/components/auth/user-menu';
import { createBrowserClient } from '@supabase/ssr';

// Mock Supabase client - need to create mock function first
const mockCreateBrowserClient = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
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

describe('UserMenu Component', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock Supabase client
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

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { container } = render(<UserMenu />);

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-muted', 'rounded-full');
    });

    it('should hide loading skeleton after user data loads', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const { container } = render(<UserMenu />);

      await waitFor(() => {
        const skeleton = container.querySelector('.animate-pulse');
        expect(skeleton).not.toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated State', () => {
    it('should show Sign In button when no user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });
    });

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

    it('should render Sign In button with correct styling', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        const signInButton = screen.getByText('Sign In');
        expect(signInButton).toBeInTheDocument();
        expect(signInButton.closest('button')).toHaveClass('inline-flex'); // Button class
      });
    });
  });

  describe('Authenticated State', () => {
    it('should show user avatar when authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: {
              avatar_url: 'https://example.com/avatar.jpg',
            },
          },
        },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        const avatar = screen.getByRole('button');
        expect(avatar).toBeInTheDocument();
      });
    });

    it('should display user email in dropdown', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'john@example.com',
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

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });
    });

    it('should display user full name when available', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'john@example.com',
            user_metadata: {
              full_name: 'John Doe',
            },
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

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should show "User" when full name is not available', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'john@example.com',
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

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });
    });
  });

  describe('Avatar Display', () => {
    it('should use avatar URL from user metadata', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: {
              avatar_url: avatarUrl,
            },
          },
        },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        const img = screen.getByAltText('test@example.com');
        expect(img).toHaveAttribute('src', expect.stringContaining(avatarUrl));
      });
    });

    it('should display initials as fallback when no avatar', async () => {
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

      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByText('TE')).toBeInTheDocument();
      });
    });

    it('should generate correct initials from email', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'john.doe@example.com',
            user_metadata: {},
          },
        },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByText('JO')).toBeInTheDocument();
      });
    });

    it('should handle empty email gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: '',
            user_metadata: {},
          },
        },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });
    });
  });

  describe('Dropdown Menu', () => {
    it('should show Profile menu item', async () => {
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

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('should show Settings menu item', async () => {
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

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should show Sign out menu item', async () => {
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

      await waitFor(() => {
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });
    });

    it('should display menu items in correct order', async () => {
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

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems).toHaveLength(3);
        expect(menuItems[0]).toHaveTextContent('Profile');
        expect(menuItems[1]).toHaveTextContent('Settings');
        expect(menuItems[2]).toHaveTextContent('Sign out');
      });
    });
  });

  describe('Navigation', () => {
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

  describe('Sign Out', () => {
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

    it('should have red text color for Sign out button', async () => {
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

      await waitFor(() => {
        const signOutItem = screen.getByText('Sign out').closest('div');
        expect(signOutItem).toHaveClass('text-red-600');
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should listen to auth state changes on mount', () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<UserMenu />);

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should update user when auth state changes', async () => {
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

      // Simulate auth state change
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
  });

  describe('Icons', () => {
    it('should display icons in menu items', async () => {
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

      const { user, container } = render(<UserMenu />);

      await waitFor(() => {
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        // Menu items should have icons (SVG elements)
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);

        // Check that SVG icons exist in the dropdown
        const icons = container.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });
});
