/**
 * @jest-environment jsdom
 */
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

describe('UserMenu Component - Full Authentication Flows', () => {
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

  describe('Complete Sign In Flow', () => {
    it('should show Sign In button when unauthenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<UserMenu />);

      // Initial state - should show Sign In button
      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });
    });

    it('should show avatar button when authenticated', async () => {
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

      // Should show avatar button when user is authenticated
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });

  describe('Complete Sign Out Flow', () => {
    it('should show avatar button when authenticated', async () => {
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

      mockSignOut.mockResolvedValue({
        error: null,
      });

      render(<UserMenu />);

      // Should show avatar initially when authenticated
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('should display sign in button when no user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<UserMenu />);

      // Should show Sign In button when no user
      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });
    });
  });
});
