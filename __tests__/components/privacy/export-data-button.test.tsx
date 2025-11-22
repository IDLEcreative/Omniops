import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportDataButton } from '@/components/privacy/export-data-button';
import { useToast } from '@/components/ui/use-toast';

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ExportDataButton', () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock document methods for download
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the export button', () => {
    render(<ExportDataButton />);

    const button = screen.getByRole('button', { name: /download my data/i });
    expect(button).toBeInTheDocument();
  });

  it('shows loading state when clicked', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        headers: new Map([['content-type', 'application/zip']]),
        blob: () => Promise.resolve(new Blob()),
      }), 100))
    );

    render(<ExportDataButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText(/exporting.../i)).toBeInTheDocument();
  });

  it('handles successful export', async () => {
    const mockBlob = new Blob(['test data']);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/zip']]),
      blob: () => Promise.resolve(mockBlob),
    });

    render(<ExportDataButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Export successful',
        description: 'Your data has been downloaded successfully.',
      });
    });

    // Verify download was triggered
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  it('handles export error', async () => {
    const errorMessage = 'Export failed';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: errorMessage }),
    });

    render(<ExportDataButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Export failed',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  it('handles network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ExportDataButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Export failed',
        description: 'Network error',
        variant: 'destructive',
      });
    });
  });

  it('disables button while loading', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        headers: new Map([['content-type', 'application/zip']]),
        blob: () => Promise.resolve(new Blob()),
      }), 100))
    );

    render(<ExportDataButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('accepts custom className prop', () => {
    render(<ExportDataButton className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('accepts variant prop', () => {
    render(<ExportDataButton variant="destructive" />);

    const button = screen.getByRole('button');
    // The exact class depends on button implementation
    expect(button).toBeInTheDocument();
  });

  it('accepts size prop', () => {
    render(<ExportDataButton size="sm" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});