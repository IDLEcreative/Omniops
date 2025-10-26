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

describe('useGdprDelete - Error Handling', () => {
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

  it('handles HTTP error responses', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ error: 'Deletion failed' }, false, 500)
    );

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(screen.getByTestId('error').textContent).toBe('Deletion failed');
    expect(screen.getByTestId('deleted-count').textContent).toBe('none');
  });

  it('handles network errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Network failure'))
    );

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(screen.getByTestId('error').textContent).toBe('Network failure');
    expect(screen.getByTestId('deleted-count').textContent).toBe('none');
  });

  it('handles missing error message in response', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({}, false, 400)
    );

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(screen.getByTestId('error').textContent).toBe('Failed to delete data');
  });

  it('clears error on successful deletion after failure', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse({ error: 'Failed' }, false, 500))
      .mockImplementationOnce(() => createFetchResponse({ deleted_count: 10 }));

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('error').textContent).not.toBe(''));
    expect(screen.getByTestId('deleted-count').textContent).toBe('none');

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('deleted-count').textContent).toBe('10'));
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('returns null on deletion failure', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ error: 'Failed' }, false, 500)
    );

    const TestWithResult = () => {
      const { remove } = useGdprDelete();
      const [result, setResult] = React.useState<number | null | undefined>(undefined);

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
          <span data-testid="result">
            {result === undefined ? 'none' : result === null ? 'null' : result.toString()}
          </span>
          <button type="button" data-testid="delete" onClick={handleDelete}>
            Delete
          </button>
        </div>
      );
    };

    render(<TestWithResult />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('result').textContent).toBe('null'));
  });
});
