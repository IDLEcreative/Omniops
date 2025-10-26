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

  const handleUnconfirmed = () => {
    remove({
      domain: 'example.com',
      sessionId: 'session-123',
      confirm: false,
    });
  };

  const handleInvalidDelete = () => {
    remove({
      domain: '',
      sessionId: '',
      confirm: true,
    });
  };

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="error">{error ?? ''}</span>
      <span data-testid="deleted-count">{deletedCount ?? 'none'}</span>
      <button type="button" data-testid="unconfirmed" onClick={handleUnconfirmed}>
        Unconfirmed
      </button>
      <button type="button" data-testid="invalid" onClick={handleInvalidDelete}>
        Invalid
      </button>
    </div>
  );
}

describe('useGdprDelete - Validation Tests', () => {
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

  it('validates confirmation is required', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('unconfirmed'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toContain(
        'Please confirm the deletion request.'
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByTestId('deleted-count').textContent).toBe('none');
  });

  it('validates domain is required', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('invalid'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toContain(
        'Domain and either session ID or email are required.'
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates session ID or email is required', async () => {
    const TestWithDomainOnly = () => {
      const { loading, error, deletedCount, remove } = useGdprDelete();
      return (
        <div>
          <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
          <span data-testid="error">{error ?? ''}</span>
          <span data-testid="deleted-count">{deletedCount ?? 'none'}</span>
          <button
            type="button"
            data-testid="delete-domain-only"
            onClick={() => remove({ domain: 'example.com', confirm: true })}
          >
            Delete
          </button>
        </div>
      );
    };

    render(<TestWithDomainOnly />);

    fireEvent.click(screen.getByTestId('delete-domain-only'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toContain(
        'Domain and either session ID or email are required.'
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns null on validation failure', async () => {
    const TestWithResult = () => {
      const { remove } = useGdprDelete();
      const [result, setResult] = React.useState<number | null | undefined>(undefined);

      const handleDelete = async () => {
        const count = await remove({
          domain: '',
          sessionId: '',
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

  it('preserves deleted count on validation error', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ deleted_count: 10 })
    );

    const TestWithDelete = () => {
      const { loading, error, deletedCount, remove } = useGdprDelete();

      const handleDelete = () => {
        remove({
          domain: 'example.com',
          sessionId: 'session-123',
          confirm: true,
        });
      };

      const handleUnconfirmed = () => {
        remove({
          domain: 'example.com',
          sessionId: 'session-123',
          confirm: false,
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
          <button type="button" data-testid="unconfirmed" onClick={handleUnconfirmed}>
            Unconfirmed
          </button>
        </div>
      );
    };

    render(<TestWithDelete />);

    fireEvent.click(screen.getByTestId('delete'));

    await waitFor(() => expect(screen.getByTestId('deleted-count').textContent).toBe('10'));

    fireEvent.click(screen.getByTestId('unconfirmed'));

    await waitFor(() => expect(screen.getByTestId('error').textContent).not.toBe(''));
    // deletedCount is preserved, not cleared on validation error
    expect(screen.getByTestId('deleted-count').textContent).toBe('10');
  });
});
