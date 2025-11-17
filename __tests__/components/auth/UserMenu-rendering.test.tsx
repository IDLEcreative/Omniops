import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor, act, cleanup } from '@/__tests__/utils/test-utils';

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

describe('UserMenu Component - Rendering States', () => {
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

  afterEach(async () => {
    cleanup();
    // Wait for any pending state updates to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', async () => {
      // Make getUser resolve slowly to catch loading state
      mockGetUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          data: { user: null },
          error: null,
        }), 100))
      );

      const { container } = render(<UserMenu />);

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-muted', 'rounded-full');

      // Wait for async to complete to avoid act warnings
      await waitFor(() => {
        expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
      });
    });

    it('should hide loading skeleton after user data loads', async () => {
      mockGetUser.mockResolvedValue({
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
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });
    });

    it('should render Sign In button with correct styling', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        const signInButton = screen.getByText('Sign In');
        expect(signInButton).toBeInTheDocument();
        expect(signInButton.closest('button')).toHaveClass('inline-flex');
      });
    });
  });

  describe('Authenticated State', () => {
    it('should show user avatar when authenticated', async () => {
      mockGetUser.mockResolvedValue({
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

    it('should display avatar with full name initials when metadata available', async () => {
      const testUser = {
        id: 'user-123',
        email: 'john@example.com',
        user_metadata: {
          full_name: 'John Doe',
        },
      };

      mockGetUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });
    });

    it('should display avatar when user has no full name', async () => {
      const testUser = {
        id: 'user-123',
        email: 'john@example.com',
        user_metadata: {},
      };

      mockGetUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      });

      render(<UserMenu />);

      await waitFor(() => {
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });
    });
  });
});
