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

describe('UserMenu Component - Avatar Display', () => {
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

  describe('Avatar URL Display', () => {
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
  });

  describe('Initials Fallback', () => {
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

  describe('Menu Icons', () => {
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
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);

        const icons = container.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });
});
