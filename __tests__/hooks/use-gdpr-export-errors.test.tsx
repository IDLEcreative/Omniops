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

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="error">{error ?? ''}</span>
      <button type="button" data-testid="download" onClick={handleDownload}>
        Download
      </button>
    </div>
  );
}

describe('useGdprExport - Error Handling', () => {
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
});
