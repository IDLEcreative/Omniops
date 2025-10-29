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

describe('UserMenu Component - Dropdown Menu', () => {
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

  describe('Dropdown Menu Items', () => {
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
});
