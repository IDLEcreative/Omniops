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

describe('ErrorBoundary - Integration and Logging', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    fetchSpy.mockRestore();
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
        expect(body.category).toBe('react_error');
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
