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

function TestComponentInvalid() {
  const { loading, error, download } = useGdprExport();

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
      <button type="button" data-testid="invalid" onClick={handleInvalidDownload}>
        Invalid
      </button>
    </div>
  );
}

describe('useGdprExport - Validation', () => {
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

  it('validates domain is required', async () => {
    render(<TestComponentInvalid />);

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

    render(<TestWithDomainOnly />);

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
});
