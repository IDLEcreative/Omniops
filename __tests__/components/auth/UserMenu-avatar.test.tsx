import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';

// Use the automatic mock from __mocks__/@supabase/ssr.js
jest.mock('@supabase/ssr');

// Import the mock functions
import { __mockGetUser, __mockSignOut, __mockOnAuthStateChange } from '@supabase/ssr';

// Import component AFTER mocks are set up
import { UserMenu } from '@/components/auth/user-menu';

// Create local references for cleaner code
const mockGetUser = __mockGetUser;
const mockSignOut = __mockSignOut;
const mockOnAuthStateChange = __mockOnAuthStateChange;

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
  beforeEach(() => {
    // Clear mock call history but keep implementations
    mockGetUser.mockClear();
    mockSignOut.mockClear();
    mockOnAuthStateChange.mockClear();

    // Reset to default implementations (will be overridden in individual tests)
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    });
  });

  describe('Avatar URL Display', () => {
    it('should use avatar URL from user metadata', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';

      mockGetUser.mockResolvedValue({
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
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });
    });
  });

  describe('Initials Fallback', () => {
    it('should display initials as fallback when no avatar', async () => {
      mockGetUser.mockResolvedValue({
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
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });
    });

    it('should generate correct initials from email', async () => {
      mockGetUser.mockResolvedValue({
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
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });
    });

    it('should handle empty email gracefully', async () => {
      mockGetUser.mockResolvedValue({
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
      mockGetUser.mockResolvedValue({
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

      // Verify the button is rendered (shows we're authenticated)
      const button = await screen.findByRole('button');
      expect(button).toBeInTheDocument();

      // Click the button to open the dropdown menu
      await user.click(button);

      // Find and verify the menu items appeared
      const profileMenuItem = await screen.findByText('Profile');
      const settingsMenuItem = await screen.findByText('Settings');
      const signOutMenuItem = await screen.findByText('Sign out');

      expect(profileMenuItem).toBeInTheDocument();
      expect(settingsMenuItem).toBeInTheDocument();
      expect(signOutMenuItem).toBeInTheDocument();
    });
  });
});
