import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { useGdprExport } from '@/hooks/use-gdpr-export';

function createFetchResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
    blob: () => Promise.resolve(new Blob([JSON.stringify(body)], { type: 'application/json' })),
  } as Response);
}

function TestComponent() {
  const { loading, error, download } = useGdprExport();

  const handleDownload = () => {
    download({
      domain: 'example.com',
      sessionId: 'session-123',
      email: 'user@example.com',
      actor: 'test-user',
    });
  };

  const handleInvalidDownload = () => {
    download({
      domain: '',
      sessionId: '',
    });
  };

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="error">{error ?? ''}</span>
      <button type="button" data-testid="download" onClick={handleDownload}>
        Download
      </button>
      <button type="button" data-testid="invalid" onClick={handleInvalidDownload}>
        Invalid
      </button>
    </div>
  );
}

describe('useGdprExport', () => {
  const originalFetch = global.fetch;
  const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
  const mockRevokeObjectURL = jest.fn();
  const mockClick = jest.fn();

  beforeEach(() => {
    jest.useRealTimers();
    global.fetch = jest.fn();

    // Mock URL APIs
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock link click
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const link = originalCreateElement('a');
        link.click = mockClick;
        return link;
      }
      return originalCreateElement(tagName);
    });
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('initializes with correct default state', async () => {
    render(<TestComponent />);

    expect(screen.getByTestId('loading').textContent).toBe('idle');
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('successfully downloads export data', async () => {
    const mockData = { messages: ['Hello', 'World'] };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/gdpr/export',
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
        }),
      })
    );

    expect(screen.getByTestId('error').textContent).toBe('');
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
    const { rerender } = render(<TestComponent />);

    const TestWithDomainOnly = () => {
      const { loading, error, download } = useGdprExport();
      return (
        <div>
          <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
          <span data-testid="error">{error ?? ''}</span>
          <button
            type="button"
            data-testid="download-domain-only"
            onClick={() => download({ domain: 'example.com' })}
          >
            Download
          </button>
        </div>
      );
    };

    rerender(<TestWithDomainOnly />);

    fireEvent.click(screen.getByTestId('download-domain-only'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toContain(
        'Domain and either session ID or email are required.'
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('allows session ID without email', async () => {
    const mockData = { messages: [] };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    const TestWithSessionOnly = () => {
      const { loading, error, download } = useGdprExport();
      return (
        <div>
          <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
          <span data-testid="error">{error ?? ''}</span>
          <button
            type="button"
            data-testid="download-session"
            onClick={() => download({ domain: 'example.com', sessionId: 'session-123' })}
          >
            Download
          </button>
        </div>
      );
    };

    render(<TestWithSessionOnly />);

    fireEvent.click(screen.getByTestId('download-session'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalled();
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('allows email without session ID', async () => {
    const mockData = { messages: [] };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    const TestWithEmailOnly = () => {
      const { loading, error, download } = useGdprExport();
      return (
        <div>
          <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
          <span data-testid="error">{error ?? ''}</span>
          <button
            type="button"
            data-testid="download-email"
            onClick={() => download({ domain: 'example.com', email: 'user@example.com' })}
          >
            Download
          </button>
        </div>
      );
    };

    render(<TestWithEmailOnly />);

    fireEvent.click(screen.getByTestId('download-email'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalled();
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('uses default actor when not provided', async () => {
    const mockData = { messages: [] };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    const TestWithoutActor = () => {
      const { loading, error, download } = useGdprExport();
      return (
        <div>
          <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
          <button
            type="button"
            data-testid="download-no-actor"
            onClick={() => download({ domain: 'example.com', sessionId: 'session-123' })}
          >
            Download
          </button>
        </div>
      );
    };

    render(<TestWithoutActor />);

    fireEvent.click(screen.getByTestId('download-no-actor'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/gdpr/export',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-actor': 'dashboard',
        }),
      })
    );
  });

  it('handles HTTP error responses', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ error: 'Export failed' }, false, 500)
    );

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(screen.getByTestId('error').textContent).toBe('Export failed');
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('handles network errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Network failure'))
    );

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(screen.getByTestId('error').textContent).toBe('Network failure');
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('handles missing error message in response', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({}, false, 400)
    );

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(screen.getByTestId('error').textContent).toBe('Failed to export data');
  });

  it('sets loading state during download', async () => {
    let resolvePromise: (value: Response) => void;
    const promise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockImplementation(() => promise);

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('loading'));

    resolvePromise!(createFetchResponse({}) as unknown as Response);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
  });

  it('clears error state on new download attempt', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse({ error: 'Failed' }, false, 500))
      .mockImplementationOnce(() => createFetchResponse({ messages: [] }));

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('error').textContent).not.toBe(''));

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe(''));
  });

  it('returns true on successful download', async () => {
    const mockData = { messages: [] };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    const TestWithResult = () => {
      const { download } = useGdprExport();
      const [result, setResult] = React.useState<boolean | null>(null);

      const handleDownload = async () => {
        const success = await download({
          domain: 'example.com',
          sessionId: 'session-123',
        });
        setResult(success);
      };

      return (
        <div>
          <span data-testid="result">{result === null ? 'none' : result.toString()}</span>
          <button type="button" data-testid="download" onClick={handleDownload}>
            Download
          </button>
        </div>
      );
    };

    render(<TestWithResult />);

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('result').textContent).toBe('true'));
  });

  it('returns false on download failure', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ error: 'Failed' }, false, 500)
    );

    const TestWithResult = () => {
      const { download } = useGdprExport();
      const [result, setResult] = React.useState<boolean | null>(null);

      const handleDownload = async () => {
        const success = await download({
          domain: 'example.com',
          sessionId: 'session-123',
        });
        setResult(success);
      };

      return (
        <div>
          <span data-testid="result">{result === null ? 'none' : result.toString()}</span>
          <button type="button" data-testid="download" onClick={handleDownload}>
            Download
          </button>
        </div>
      );
    };

    render(<TestWithResult />);

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('result').textContent).toBe('false'));
  });

  it('returns false on validation failure', async () => {
    const TestWithResult = () => {
      const { download } = useGdprExport();
      const [result, setResult] = React.useState<boolean | null>(null);

      const handleDownload = async () => {
        const success = await download({
          domain: '',
          sessionId: '',
        });
        setResult(success);
      };

      return (
        <div>
          <span data-testid="result">{result === null ? 'none' : result.toString()}</span>
          <button type="button" data-testid="download" onClick={handleDownload}>
            Download
          </button>
        </div>
      );
    };

    render(<TestWithResult />);

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('result').textContent).toBe('false'));
  });

  it('completes download successfully twice', async () => {
    const mockData = { messages: [] };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('download'));
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toBe('');

    fireEvent.click(screen.getByTestId('download'));
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toBe('');

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('completes download process without errors', async () => {
    const mockData = { messages: [] };
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('download'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('error').textContent).toBe('');
  });
});
