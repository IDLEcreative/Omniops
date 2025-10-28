import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import { QuickStart } from '@/app/dashboard/installation/components/QuickStart';

// Mock the EmbedCodeGenerator component
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

      expect(screen.getByText(/Loading your configuration/)).toBeInTheDocument();
    });

    it('should hide content when loading', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={true}
        />
      );

      expect(screen.queryByText(/Next Steps/)).not.toBeInTheDocument();
    });
  });

  describe('Domain Configuration', () => {
    it('should show success alert when domain is configured', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/Configuration Detected/)).toBeInTheDocument();
      expect(screen.getByText('test.com')).toBeInTheDocument();
    });

    it('should show error alert when no domain configured', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain=""
          isLoading={false}
        />
      );

      expect(screen.getByText(/No Domain Configured/)).toBeInTheDocument();
    });
  });


  describe('Progress Tracking', () => {
    it('should initialize with empty progress', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/0 of 4 completed/)).toBeInTheDocument();
    });

    it('should display progress tracking UI', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/Installation Progress/)).toBeInTheDocument();
    });

  });

  describe('Preview Dialog', () => {
    it('should render preview button', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/Preview Widget/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null serverUrl gracefully', () => {
      render(
        <QuickStart
          serverUrl=""
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/Configuration Detected/)).toBeInTheDocument();
    });

    it('should handle undefined domain gracefully', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain=""
          isLoading={false}
        />
      );

      expect(screen.getByText(/No Domain Configured/)).toBeInTheDocument();
    });

    it('should handle special characters in domain', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test-domain.co.uk"
          isLoading={false}
        />
      );

      expect(screen.getByText('test-domain.co.uk')).toBeInTheDocument();
    });

    it('should handle localStorage errors gracefully', () => {
      mockGetLocalStorage.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/Next Steps/)).toBeInTheDocument();
    });
  });

  describe('Step Display', () => {
    it('should render all 4 step descriptions', () => {
      render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText(/Add the code to your website/)).toBeInTheDocument();
      expect(screen.getByText(/Test on your staging site/)).toBeInTheDocument();
      expect(screen.getByText(/Verify widget appearance/)).toBeInTheDocument();
      expect(screen.getByText(/Deploy to production/)).toBeInTheDocument();
    });

    it('should render step numbers correctly', () => {
      const { container } = render(
        <QuickStart
          serverUrl="https://example.com"
          domain="test.com"
          isLoading={false}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });
});
