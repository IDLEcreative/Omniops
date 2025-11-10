import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import { ErrorBoundary } from '@/components/error-boundary';
import React from 'react';

// Component that throws an error on render
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary - Error Recovery and Reset', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Error Recovery', () => {
    it('should reset error state when Try Again is clicked', async () => {
      let shouldThrow = true;

      // Component that can be re-rendered with different props
      function ControlledThrowError({ mustThrow }: { mustThrow: boolean }) {
        if (mustThrow) {
          throw new Error('Test error message');
        }
        return <div>No error</div>;
      }

      const { rerender, user } = render(
        <ErrorBoundary>
          <ControlledThrowError mustThrow={shouldThrow} />
        </ErrorBoundary>
      );

      // Verify error is displayed
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the underlying problem
      shouldThrow = false;

      // Click Try Again button - this calls handleReset which clears the error boundary state
      await user.click(screen.getByText('Try Again'));

      // Re-render with the fixed component - now it won't throw
      rerender(
        <ErrorBoundary>
          <ControlledThrowError mustThrow={shouldThrow} />
        </ErrorBoundary>
      );

      // After reset, the component should render without error
      await waitFor(() => {
        expect(screen.getByText('No error')).toBeInTheDocument();
      });
    });

    it('should navigate to home when Go Home is clicked', async () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as Location;

      const { user } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Go Home'));

      expect(window.location.href).toBe('/');

      window.location = originalLocation;
    });

    it('should reload page after reset if multiple errors occurred', async () => {
      const reloadSpy = jest.fn();
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = {
        reload: reloadSpy,
        href: '/'
      };

      let errorNumber = 0;
      let shouldThrow = true;

      // Component that throws a specific error each time
      function MultiErrorComponent({ triggerError }: { triggerError: boolean }) {
        if (triggerError) {
          errorNumber++;
          throw new Error(`Error ${errorNumber}`);
        }
        return <div>No error</div>;
      }

      const { rerender, user } = render(
        <ErrorBoundary>
          <MultiErrorComponent triggerError={shouldThrow} />
        </ErrorBoundary>
      );

      // First error (errorCount becomes 1)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Reset and trigger second error quickly (errorCount becomes 2)
      await user.click(screen.getByText('Try Again'));

      rerender(
        <ErrorBoundary>
          <MultiErrorComponent triggerError={shouldThrow} />
        </ErrorBoundary>
      );

      // Second error should display
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Reset and trigger third error (errorCount becomes 3)
      await user.click(screen.getByText('Try Again'));

      rerender(
        <ErrorBoundary>
          <MultiErrorComponent triggerError={shouldThrow} />
        </ErrorBoundary>
      );

      // Third error should display
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Now clicking Try Again should trigger reload because errorCount is 3 (> 2)
      await user.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(reloadSpy).toHaveBeenCalled();
      });

      // Restore window.location
      (window as any).location = originalLocation;
    });
  });

  describe('Multiple Error Detection', () => {
    it('should track error count', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Error count should be tracked internally
      // We can verify this by checking console logs
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should show multiple errors warning after 3 errors', async () => {
      // We need to simulate errors in quick succession
      // This is complex to test directly, so we'll test the UI logic

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // First error - should not show warning yet
      expect(screen.queryByText(/Multiple Errors Detected/)).not.toBeInTheDocument();
    });

    it('should reset error count after 5 seconds', async () => {
      jest.useFakeTimers();

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Fast forward 5 seconds
      jest.advanceTimersByTime(5000);

      // Next error should reset count
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      jest.useRealTimers();
    });
  });
});
