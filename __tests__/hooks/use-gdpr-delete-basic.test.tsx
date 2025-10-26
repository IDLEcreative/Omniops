import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { useGdprDelete } from '@/hooks/use-gdpr-delete';

function createFetchResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function TestComponent() {
  const { loading, error, deletedCount, remove } = useGdprDelete();

  const handleDelete = () => {
    remove({
      domain: 'example.com',
      sessionId: 'session-123',
      email: 'user@example.com',
      confirm: true,
      actor: 'test-user',
    });
  };

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="error">{error ?? ''}</span>
      <span data-testid="deleted-count">{deletedCount ?? 'none'}</span>
      <button type="button" data-testid="delete" onClick={handleDelete}>
        Delete
      </button>
    </div>
  );
}

describe('useGdprDelete - Basic Operations', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useRealTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    cleanup();
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('initializes with correct default state', async () => {
    render(<TestComponent />);

    expect(screen.getByTestId('loading').textContent).toBe('idle');
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(screen.getByTestId('deleted-count').textContent).toBe('none');
  });

  it('successfully deletes data', async () => {
    const mockResponse = { deleted_count: 42, message: 'Success' };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockResponse));

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/gdpr/delete',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor': 'test-user',
        },
        body: JSON.stringify({
          domain: 'example.com',
          session_id: 'session-123',
          email: 'user@example.com',
          confirm: true,
        }),
      })
    );

    expect(screen.getByTestId('deleted-count').textContent).toBe('42');
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('allows session ID without email', async () => {
    const mockResponse = { deleted_count: 10 };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockResponse));

    const TestWithSessionOnly = () => {
      const { loading, error, deletedCount, remove } = useGdprDelete();
      return (
        <div>
          <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
          <span data-testid="error">{error ?? ''}</span>
          <span data-testid="deleted-count">{deletedCount ?? 'none'}</span>
          <button
            type="button"
            data-testid="delete-session"
            onClick={() =>
              remove({ domain: 'example.com', sessionId: 'session-123', confirm: true })
            }
          >
            Delete
          </button>
        </div>
      );
    };

    render(<TestWithSessionOnly />);

    fireEvent.click(screen.getByTestId('delete-session'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalled();
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(screen.getByTestId('deleted-count').textContent).toBe('10');
  });

  it('allows email without session ID', async () => {
    const mockResponse = { deleted_count: 5 };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockResponse));

    const TestWithEmailOnly = () => {
      const { loading, error, deletedCount, remove } = useGdprDelete();
      return (
        <div>
          <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
          <span data-testid="error">{error ?? ''}</span>
          <span data-testid="deleted-count">{deletedCount ?? 'none'}</span>
          <button
            type="button"
            data-testid="delete-email"
            onClick={() =>
              remove({ domain: 'example.com', email: 'user@example.com', confirm: true })
            }
          >
            Delete
          </button>
        </div>
      );
    };

    render(<TestWithEmailOnly />);

    fireEvent.click(screen.getByTestId('delete-email'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalled();
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(screen.getByTestId('deleted-count').textContent).toBe('5');
  });

  it('uses default actor when not provided', async () => {
    const mockResponse = { deleted_count: 1 };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockResponse));

    const TestWithoutActor = () => {
      const { loading, remove } = useGdprDelete();
      return (
        <div>
          <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
          <button
            type="button"
            data-testid="delete-no-actor"
            onClick={() =>
              remove({ domain: 'example.com', sessionId: 'session-123', confirm: true })
            }
          >
            Delete
          </button>
        </div>
      );
    };

    render(<TestWithoutActor />);

    fireEvent.click(screen.getByTestId('delete-no-actor'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/gdpr/delete',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-actor': 'dashboard',
        }),
      })
    );
  });

  it('handles zero deleted count', async () => {
    const mockResponse = { deleted_count: 0 };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockResponse));

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(screen.getByTestId('deleted-count').textContent).toBe('0');
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('handles missing deleted_count in response', async () => {
    const mockResponse = { message: 'Success' };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockResponse));

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(screen.getByTestId('deleted-count').textContent).toBe('0');
  });

  it('sets loading state during deletion', async () => {
    let resolvePromise: (value: Response) => void;
    const promise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockImplementation(() => promise);

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('loading'));

    resolvePromise!(createFetchResponse({ deleted_count: 1 }) as unknown as Response);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
  });

  it('returns deleted count on success', async () => {
    const mockResponse = { deleted_count: 25 };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockResponse));

    const TestWithResult = () => {
      const { remove } = useGdprDelete();
      const [result, setResult] = React.useState<number | null>(null);

      const handleDelete = async () => {
        const count = await remove({
          domain: 'example.com',
          sessionId: 'session-123',
          confirm: true,
        });
        setResult(count);
      };

      return (
        <div>
          <span data-testid="result">{result === null ? 'none' : result.toString()}</span>
          <button type="button" data-testid="delete" onClick={handleDelete}>
            Delete
          </button>
        </div>
      );
    };

    render(<TestWithResult />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('result').textContent).toBe('25'));
  });

  it('resets deleted count on new deletion attempt', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse({ deleted_count: 10 }))
      .mockImplementationOnce(() => createFetchResponse({ deleted_count: 5 }));

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('deleted-count').textContent).toBe('10'));

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('deleted-count').textContent).toBe('5'));
  });
});
