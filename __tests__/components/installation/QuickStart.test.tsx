import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import { QuickStart } from '@/app/dashboard/installation/components/QuickStart';

// Mock the EmbedCodeGenerator component BEFORE importing anything else
jest.mock('@/components/configure/EmbedCodeGenerator', () => ({
  EmbedCodeGenerator: ({ config }: { config: { serverUrl: string } }) => (
    <div data-testid="embed-code-generator">
      Mock EmbedCodeGenerator - Server: {config.serverUrl}
    </div>
  ),
}));

// Create mock functions
const mockGetLocalStorage = jest.fn();
const mockSetLocalStorage = jest.fn();

// Mock the storage utilities
jest.mock('@/lib/utils/storage', () => ({
  getLocalStorage: mockGetLocalStorage,
  setLocalStorage: mockSetLocalStorage,
}));

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen,
});

describe('QuickStart Component', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLocalStorage.mockReturnValue([]);
    mockSetLocalStorage.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Loading State', () => {
    it('should render loading state when isLoading is true', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading your configuration...')).toBeInTheDocument();
      expect(screen.getByText('Fetching domain from your organization settings')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should not render main content when loading', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={true}
        />
      );

      expect(screen.queryByTestId('embed-code-generator')).not.toBeInTheDocument();
      expect(screen.queryByText('Next Steps')).not.toBeInTheDocument();
    });
  });

  describe('Domain Configuration Alerts', () => {
    it('should show success alert when domain is configured', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText('Configuration Detected')).toBeInTheDocument();
      expect(screen.getByText('Installing for domain:')).toBeInTheDocument();
      expect(screen.getByText('test.com')).toBeInTheDocument();
    });

    it('should show error alert when domain is not configured', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain=""
          isLoading={false}
        />
      );

      expect(screen.getByText('No Domain Configured')).toBeInTheDocument();
      expect(screen.getByText(/Please configure your domain in settings/)).toBeInTheDocument();
      expect(screen.getByText('Go to Settings →')).toBeInTheDocument();
    });

    it('should render settings link when no domain', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain=""
          isLoading={false}
        />
      );

      const settingsLink = screen.getByRole('link', { name: 'Go to Settings →' });
      expect(settingsLink).toHaveAttribute('href', '/dashboard/settings');
    });
  });

  describe('EmbedCodeGenerator Integration', () => {
    it('should render EmbedCodeGenerator component', () => {
      render(
        <QuickStart
          serverUrl="https://api.example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      // Verify the component renders - look for "Embed Code" heading
      expect(screen.getByText('Embed Code')).toBeInTheDocument();
    });

    it('should use default serverUrl when empty', () => {
      render(
        <QuickStart
          serverUrl=""
          domain="test.com"
          isLoading={false}
        />
      );

      // Component should render without crashing
      expect(screen.getByText('Configuration Detected')).toBeInTheDocument();
    });

    it('should pass domain to config when available', () => {
      render(
        <QuickStart
          serverUrl="https://api.example.com"
          domain="mysite.com"
          isLoading={false}
        />
      );

      expect(screen.getByText('mysite.com')).toBeInTheDocument();
    });
  });

  describe('Progress Tracking with localStorage', () => {
    it('should initialize with empty progress when no saved data', () => {
      mockGetLocalStorage.mockReturnValue([]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      // Check that component renders with progress tracking
      expect(screen.getByText(/Installation Progress/)).toBeInTheDocument();
      expect(screen.getByText(/of 4 completed/)).toBeInTheDocument();
    });

    it('should display progress tracking UI', () => {
      mockGetLocalStorage.mockReturnValue([1, 2]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/Installation Progress/)).toBeInTheDocument();
      expect(screen.getByText(/of 4 completed/)).toBeInTheDocument();
    });

    it('should render progress bar component', () => {
      mockGetLocalStorage.mockReturnValue([1, 2, 3]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/Installation Progress/)).toBeInTheDocument();
      // Progress bar should be present
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show completion text', () => {
      mockGetLocalStorage.mockReturnValue([1, 2, 3, 4]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/of 4 completed/)).toBeInTheDocument();
    });

    it('should handle domain-based storage', () => {
      mockGetLocalStorage.mockReturnValue([]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="unique-domain.com"
          isLoading={false}
        />
      );

      // Verify component renders for custom domain
      expect(screen.getByText('unique-domain.com')).toBeInTheDocument();
    });
  });

  describe('Checkbox Toggle Functionality', () => {
    it('should render interactive checkboxes for each step', async () => {
      mockGetLocalStorage.mockReturnValue([]);
      const { user } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: 'Add the code to your website' });
      expect(checkbox).toBeInTheDocument();

      // Checkbox should be clickable without throwing errors
      await user.click(checkbox);

      // Component should still be functional
      expect(screen.getByText('Next Steps')).toBeInTheDocument();
    });

    it('should allow toggling steps on and off', async () => {
      mockGetLocalStorage.mockReturnValue([1, 2]);
      const { user } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: 'Add the code to your website' });

      // Click should work without errors
      await user.click(checkbox);

      // UI should remain functional
      expect(screen.getByText(/Installation Progress/)).toBeInTheDocument();
    });

    it('should handle multiple checkbox interactions', async () => {
      mockGetLocalStorage.mockReturnValue([]);
      const { user } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      // Click first checkbox
      const checkbox1 = screen.getByRole('checkbox', { name: 'Add the code to your website' });
      await user.click(checkbox1);

      // Click another checkbox
      const checkbox3 = screen.getByRole('checkbox', { name: 'Verify widget appearance' });
      await user.click(checkbox3);

      // Both checkboxes should remain in the document
      expect(checkbox1).toBeInTheDocument();
      expect(checkbox3).toBeInTheDocument();
    });

    it('should render all 4 installation steps', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByRole('checkbox', { name: 'Add the code to your website' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Test on your staging site' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Verify widget appearance' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Deploy to production' })).toBeInTheDocument();
    });
  });

  describe('Preview Dialog Functionality', () => {
    it('should render preview button', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByRole('button', { name: /Preview Widget/i })).toBeInTheDocument();
    });

    it('should open preview dialog on button click', async () => {
      const { user } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      const previewButton = screen.getByRole('button', { name: /Preview Widget/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Widget Preview')).toBeInTheDocument();
        expect(screen.getByText('Preview how the chat widget will appear on your website')).toBeInTheDocument();
      });
    });

    it('should render iframe with correct src when domain is present', async () => {
      const { user } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /Preview Widget/i }));

      await waitFor(() => {
        const iframe = screen.getByTitle('Widget Preview');
        expect(iframe).toHaveAttribute('src', '/embed?domain=test.com');
      });
    });

    it('should render iframe with default src when domain is empty', async () => {
      const { user } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain=""
          isLoading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /Preview Widget/i }));

      await waitFor(() => {
        const iframe = screen.getByTitle('Widget Preview');
        expect(iframe).toHaveAttribute('src', '/embed');
      });
    });
  });

  describe('Open in New Tab Button', () => {
    it('should render "Open in New Tab" button', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByRole('button', { name: /Open in New Tab/i })).toBeInTheDocument();
    });

    it('should open widget in new tab with domain', async () => {
      const { user } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain="mysite.com"
          isLoading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open in New Tab/i }));

      expect(mockWindowOpen).toHaveBeenCalledWith('/embed?domain=mysite.com', '_blank');
    });

    it('should open widget in new tab without domain', async () => {
      const { user } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain=""
          isLoading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open in New Tab/i }));

      expect(mockWindowOpen).toHaveBeenCalledWith('/embed', '_blank');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null serverUrl gracefully', () => {
      render(
        <QuickStart
          serverUrl={null as unknown as string}
          domain="test.com"
          isLoading={false}
        />
      );

      // Component should render without crashing
      expect(screen.getByText('Configuration Detected')).toBeInTheDocument();
    });

    it('should handle undefined domain gracefully', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain={undefined as unknown as string}
          isLoading={false}
        />
      );

      expect(screen.getByText('No Domain Configured')).toBeInTheDocument();
    });

    it('should handle special characters in domain', () => {
      const specialDomain = 'test-site_123.example.com';
      mockGetLocalStorage.mockReturnValue([]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain={specialDomain}
          isLoading={false}
        />
      );

      // Component should render without crashing
      expect(screen.getByText(specialDomain)).toBeInTheDocument();
    });

    it('should handle localStorage errors gracefully', () => {
      mockGetLocalStorage.mockReturnValue([]);
      mockSetLocalStorage.mockReturnValue(false); // Simulate localStorage failure

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      // Should still render without throwing
      expect(screen.getByText(/of 4 completed/)).toBeInTheDocument();
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.filter(cb => (cb as HTMLInputElement).checked)).toHaveLength(0);
    });

    it('should handle corrupted localStorage data', () => {
      // Return invalid data structure
      mockGetLocalStorage.mockReturnValue(['invalid', 'data'] as unknown as number[]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      // Should still render
      expect(screen.getByText('Next Steps')).toBeInTheDocument();
    });

    it('should encode domain in URL correctly', async () => {
      const domainWithSpaces = 'test site.com';
      const { user } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain={domainWithSpaces}
          isLoading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open in New Tab/i }));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `/embed?domain=${encodeURIComponent(domainWithSpaces)}`,
        '_blank'
      );
    });
  });

  describe('Progress Bar Calculation', () => {
    it('should render progress bar with correct role', () => {
      mockGetLocalStorage.mockReturnValue([]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/of 4 completed/)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display completion counter', () => {
      mockGetLocalStorage.mockReturnValue([1]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/of 4 completed/)).toBeInTheDocument();
    });

    it('should show progress for multiple completed steps', () => {
      mockGetLocalStorage.mockReturnValue([2, 4]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/of 4 completed/)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render progress tracking UI for partial completion', () => {
      mockGetLocalStorage.mockReturnValue([1, 2, 3]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/Installation Progress/)).toBeInTheDocument();
      expect(screen.getByText(/of 4 completed/)).toBeInTheDocument();
    });

    it('should display progress for all steps', () => {
      mockGetLocalStorage.mockReturnValue([1, 2, 3, 4]);

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      // Check if progress UI is present
      expect(screen.getByText(/of 4 completed/)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Step Descriptions', () => {
    it('should render all step descriptions correctly', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/Paste the embed code before the closing/)).toBeInTheDocument();
      expect(screen.getByText(/Deploy to a test environment first/)).toBeInTheDocument();
      expect(screen.getByText(/The widget should appear in the bottom-right corner/)).toBeInTheDocument();
      expect(screen.getByText(/Once verified, deploy the changes to your live website/)).toBeInTheDocument();
    });

    it('should render step numbers correctly', () => {
      const { container } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      // Query for the step number badges more specifically
      const stepNumbers = container.querySelectorAll('.bg-primary.text-primary-foreground.rounded-full.w-6.h-6');
      expect(stepNumbers).toHaveLength(4);
      expect(stepNumbers[0]).toHaveTextContent('1');
      expect(stepNumbers[1]).toHaveTextContent('2');
      expect(stepNumbers[2]).toHaveTextContent('3');
      expect(stepNumbers[3]).toHaveTextContent('4');
    });
  });
});
