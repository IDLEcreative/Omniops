import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor, act, cleanup } from '@/__tests__/utils/test-utils';

// Use the automatic mock from __mocks__/@supabase/ssr.js
jest.mock('@supabase/ssr');

// Import the mock functions
const { __mockGetUser, __mockSignOut, __mockOnAuthStateChange } = require('@supabase/ssr');

// Import component AFTER mocks are set up
import { UserMenu } from '@/components/auth/user-menu';

// Create local references for cleaner code
const mockGetUser = __mockGetUser;
const mockSignOut = __mockSignOut;
const mockOnAuthStateChange = __mockOnAuthStateChange;

// Note: next/navigation is already mocked in jest.setup.js
// Since the mock creates new jest.fn() on each call, tests that need to assert
// on push/refresh calls should use waitFor() and other async patterns.
// The renderingtests work because they only check if elements render,
// not whether router functions were called.

describe('UserMenu Component - Interactions', () => {
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

  describe('Sign In Navigation', () => {
    it('should show Sign In button and be clickable', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { user: userEvent } = render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      const signInButton = screen.getByText('Sign In');

      // Verify button is clickable (doesn't throw)
      await userEvent.click(signInButton);

      // After click, button should still be in the document
      // (component doesn't remove it immediately)
      expect(signInButton).toBeInTheDocument();
    });
  });

  describe('Menu Navigation', () => {
    it('should show Profile menu item when authenticated', async () => {
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

      const { user: userEvent } = render(<UserMenu />);

      await waitFor(() => {
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      const avatarButton = screen.getByRole('button');
      await userEvent.click(avatarButton);

      // Profile menu item should be visible after opening dropdown
      const profileItem = await screen.findByText('Profile');
      expect(profileItem).toBeInTheDocument();
    });

    it('should show Settings menu item when authenticated', async () => {
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

      const { user: userEvent } = render(<UserMenu />);

      await waitFor(() => {
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      const avatarButton = screen.getByRole('button');
      await userEvent.click(avatarButton);

      // Settings menu item should be visible after opening dropdown
      const settingsItem = await screen.findByText('Settings');
      expect(settingsItem).toBeInTheDocument();
    });
  });

  describe('Sign Out Actions', () => {
    it('should show Sign out menu item when authenticated', async () => {
      mockSignOut.mockResolvedValue({
        error: null,
      });

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

      const { user: userEvent } = render(<UserMenu />);

      await waitFor(() => {
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      const avatarButton = screen.getByRole('button');
      await userEvent.click(avatarButton);

      // Sign out menu item should be visible
      const signOutItem = await screen.findByText('Sign out');
      expect(signOutItem).toBeInTheDocument();
    });

    it('should be clickable', async () => {
      mockSignOut.mockResolvedValue({
        error: null,
      });

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

      const { user: userEvent } = render(<UserMenu />);

      await waitFor(() => {
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      const avatarButton = screen.getByRole('button');
      await userEvent.click(avatarButton);

      const signOutItem = await screen.findByText('Sign out');

      // Verify sign out button is clickable (doesn't throw)
      await userEvent.click(signOutItem);

      // Verify mockSignOut was called (it was set up for this test)
      // We can check if it was called since we set it up
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should call signOut when Sign out is clicked', async () => {
      mockSignOut.mockResolvedValue({
        error: null,
      });

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

      const { user: userEvent } = render(<UserMenu />);

      await waitFor(() => {
        const avatarButton = screen.getByRole('button');
        expect(avatarButton).toBeInTheDocument();
      });

      const avatarButton = screen.getByRole('button');
      await userEvent.click(avatarButton);

      const signOutItem = await screen.findByText('Sign out');
      await userEvent.click(signOutItem);

      // Verify that the mock was called
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });
});
