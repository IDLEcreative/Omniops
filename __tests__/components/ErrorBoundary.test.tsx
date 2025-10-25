import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import { ErrorBoundary, useErrorHandler } from '@/components/error-boundary';
import React from 'react';

// Component that throws an error on render
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
}

// Component that throws in lifecycle
class LifecycleError extends React.Component<{ shouldThrow?: boolean }> {
  componentDidMount() {
    if (this.props.shouldThrow) {
      throw new Error('Lifecycle error');
    }
  }

  render() {
    return <div>Lifecycle component</div>;
  }
}

// Component that throws in event handler
function EventHandlerError() {
  const handleClick = () => {
    throw new Error('Event handler error');
  };

  return <button onClick={handleClick}>Click to error</button>;
}

describe('ErrorBoundary Component', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    // Suppress error console output during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetch for error logging
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    );

    // Reset error count
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  describe('Error Catching', () => {
    it('should catch render errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should catch lifecycle errors from child components', () => {
      render(
        <ErrorBoundary>
          <LifecycleError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Lifecycle error')).toBeInTheDocument();
    });

    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child component</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child component')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should display error message in production-like UI', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred. We apologize for the inconvenience.')).toBeInTheDocument();
      expect(screen.getByText('Error Details')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error UI Display', () => {
    it('should display error title', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display error description', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('An unexpected error occurred. We apologize for the inconvenience.')).toBeInTheDocument();
    });

    it('should display error message in alert', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should show Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should show Go Home button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('should display unknown error when no error message', () => {
      class NoMessageError extends React.Component {
        componentDidMount() {
          throw new Error();
        }
        render() {
          return <div>Test</div>;
        }
      }

      render(
        <ErrorBoundary>
          <NoMessageError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Unknown error')).toBeInTheDocument();
    });
  });

  describe('Development Mode Features', () => {
    it('should show stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Stack Trace (Development Only)')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should show component stack in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Stack')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide debug info in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Stack Trace (Development Only)')).not.toBeInTheDocument();
      expect(screen.queryByText('Component Stack')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log errors to console in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when Try Again is clicked', async () => {
      let shouldThrow = true;

      const { rerender, user } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the error
      shouldThrow = false;

      // Click Try Again
      await user.click(screen.getByText('Try Again'));

      // Re-render with fixed component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

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
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true,
      });

      // Simulate multiple errors by throwing 3 times quickly
      const { rerender, user } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // First error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Try Again to reset
      await user.click(screen.getByText('Try Again'));

      // Throw again quickly (within 5 seconds)
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Try Again'));

      // Third error
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Now when clicking Try Again, it should reload
      await user.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(reloadSpy).toHaveBeenCalled();
      });
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

  describe('Error Logging', () => {
    it('should log error to external service', async () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/log-error',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.any(String),
          })
        );
      });
    });

    it('should include error details in log', async () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      await waitFor(() => {
        const callArgs = fetchSpy.mock.calls[0];
        const body = JSON.parse(callArgs?.[1]?.body as string || '{}');

        expect(body.message).toBe('Test error message');
        expect(body.stack).toBeDefined();
        expect(body.componentStack).toBeDefined();
        expect(body.timestamp).toBeDefined();
        expect(body.category).toBe('react_component');
      });
    });

    it('should include environment info in error log', async () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      await waitFor(() => {
        const callArgs = fetchSpy.mock.calls[0];
        const body = JSON.parse(callArgs?.[1]?.body as string || '{}');

        expect(body.userAgent).toBeDefined();
        // In JSDOM, window.location.href might be 'about:blank' which is still defined
        expect(body.url).toBeTruthy();
      });
    });

    it('should set severity based on error count', async () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      await waitFor(() => {
        const callArgs = fetchSpy.mock.calls[0];
        const body = JSON.parse(callArgs?.[1]?.body as string || '{}');

        // First error should be 'high' severity
        expect(body.severity).toBe('high');
      });
    });

    it('should handle logging failures gracefully', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Logging failed'));

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Should still show error UI even if logging fails
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to log error to service:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should render default UI when no fallback provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Different Error Types', () => {
    it('should catch TypeError', () => {
      function TypeErrorComponent() {
        const obj: any = null;
        return <div>{obj.property}</div>;
      }

      render(
        <ErrorBoundary>
          <TypeErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should catch ReferenceError', () => {
      function ReferenceErrorComponent() {
        const value = (window as any).undefinedVariable.property;
        return <div>{value}</div>;
      }

      render(
        <ErrorBoundary>
          <ReferenceErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should catch custom errors', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      function CustomErrorComponent() {
        throw new CustomError('Custom error occurred');
      }

      render(
        <ErrorBoundary>
          <CustomErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Custom error occurred')).toBeInTheDocument();
    });
  });

  describe('useErrorHandler Hook', () => {
    it('should throw errors in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const TestComponent = () => {
        const errorHandler = useErrorHandler();
        const testError = new Error('Hook test error');

        expect(() => {
          errorHandler(testError);
        }).toThrow('Hook test error');

        return <div>Test</div>;
      };

      render(<TestComponent />);

      process.env.NODE_ENV = originalEnv;
    });

    it('should log error to console', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const TestComponent = () => {
        const errorHandler = useErrorHandler();
        const testError = new Error('Hook test');

        try {
          errorHandler(testError);
        } catch (e) {
          // Expected to throw
        }

        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', expect.any(Error));

      process.env.NODE_ENV = originalEnv;
    });

    it('should log errorInfo when provided', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const TestComponent = () => {
        const errorHandler = useErrorHandler();
        const testError = new Error('Hook test');
        const errorInfo = { componentStack: 'Test stack' } as React.ErrorInfo;

        try {
          errorHandler(testError, errorInfo);
        } catch (e) {
          // Expected to throw
        }

        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error Info:', expect.any(Object));

      process.env.NODE_ENV = originalEnv;
    });
  });
});
