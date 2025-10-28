import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlatformGuides } from '@/app/dashboard/installation/components/PlatformGuides';

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('PlatformGuides Component', () => {
  const defaultServerUrl = 'https://example.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the PlatformGuides component', () => {
      render(<PlatformGuides serverUrl={defaultServerUrl} />);

      expect(screen.getByText('Platform-Specific Installation Guides')).toBeInTheDocument();
    });

    it('should render all 6 platform tabs', () => {
      render(<PlatformGuides serverUrl={defaultServerUrl} />);

      expect(screen.getByText('WordPress')).toBeInTheDocument();
      expect(screen.getByText('Shopify')).toBeInTheDocument();
      expect(screen.getByText('WooCommerce')).toBeInTheDocument();
      expect(screen.getByText('Next.js')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Plain HTML')).toBeInTheDocument();
    });

    it('should use default serverUrl when not provided', () => {
      render(<PlatformGuides serverUrl="" />);

      expect(screen.getByText('WordPress')).toBeInTheDocument();
    });

    it('should accept custom serverUrl prop', () => {
      render(<PlatformGuides serverUrl="https://custom.com" />);

      expect(screen.getByText('WordPress')).toBeInTheDocument();
    });
  });

  describe('Platform Icons', () => {
    it('should render WordPress icon', () => {
      const { container } = render(<PlatformGuides serverUrl={defaultServerUrl} />);

      const wordpressSection = screen.getByText('WordPress').closest('button');
      const icon = wordpressSection?.querySelector('svg');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-blue-600');
    });

    it('should render Shopify icon', () => {
      const { container } = render(<PlatformGuides serverUrl={defaultServerUrl} />);

      const shopifySection = screen.getByText('Shopify').closest('button');
      const icon = shopifySection?.querySelector('svg');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-green-600');
    });

    it('should render WooCommerce icon', () => {
      const { container } = render(<PlatformGuides serverUrl={defaultServerUrl} />);

      const wooSection = screen.getByText('WooCommerce').closest('button');
      const icon = wooSection?.querySelector('svg');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-purple-600');
    });

    it('should render Next.js icon', () => {
      const { container } = render(<PlatformGuides serverUrl={defaultServerUrl} />);

      const nextSection = screen.getByText('Next.js').closest('button');
      const icon = nextSection?.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });

    it('should render React icon', () => {
      const { container } = render(<PlatformGuides serverUrl={defaultServerUrl} />);

      const reactSection = screen.getByText('React').closest('button');
      const icon = reactSection?.querySelector('svg');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-cyan-500');
    });

    it('should render HTML icon', () => {
      const { container } = render(<PlatformGuides serverUrl={defaultServerUrl} />);

      const htmlSection = screen.getByText('Plain HTML').closest('button');
      const icon = htmlSection?.querySelector('svg');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-orange-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty serverUrl', () => {
      render(<PlatformGuides serverUrl="" />);

      expect(screen.getByText('WordPress')).toBeInTheDocument();
    });

    it('should handle serverUrl without protocol', () => {
      render(<PlatformGuides serverUrl="example.com" />);

      expect(screen.getByText('WordPress')).toBeInTheDocument();
    });

    it('should handle serverUrl with trailing slash', () => {
      render(<PlatformGuides serverUrl="https://example.com/" />);

      expect(screen.getByText('WordPress')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible accordion structure', () => {
      const { container } = render(<PlatformGuides serverUrl={defaultServerUrl} />);

      // Check for accordion buttons
      const buttons = container.querySelectorAll('button[data-state]');
      expect(buttons.length).toBe(6); // 6 platforms
    });
  });
});
