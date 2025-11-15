/**
 * ProductRecommendations Component Tests
 *
 * Tests the recommendation carousel UI component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductRecommendations } from '@/components/chat/ProductRecommendations';
import { useRecommendations } from '@/hooks/useRecommendations';

// Mock the hook
jest.mock('@/hooks/useRecommendations');

const mockUseRecommendations = useRecommendations as jest.MockedFunction<
  typeof useRecommendations
>;

describe('ProductRecommendations Component', () => {
  const defaultProps = {
    sessionId: 'test-session',
    conversationId: 'test-conversation',
    domainId: 'test-domain',
    limit: 5,
  };

  const mockRecommendations = [
    {
      productId: 'product-1',
      score: 0.95,
      algorithm: 'hybrid',
      reason: 'Highly recommended based on multiple factors',
      metadata: { algorithms: ['vector', 'collaborative'] },
    },
    {
      productId: 'product-2',
      score: 0.85,
      algorithm: 'vector_similarity',
      reason: 'Semantically similar to your interests',
      metadata: { similarity: 0.85 },
    },
    {
      productId: 'product-3',
      score: 0.75,
      algorithm: 'collaborative',
      reason: 'Users with similar interests also liked this',
      metadata: { similarUserCount: 15 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      mockUseRecommendations.mockReturnValue({
        recommendations: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
        trackClick: jest.fn(),
        trackPurchase: jest.fn(),
      });

      render(<ProductRecommendations {...defaultProps} />);

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('should not show recommendations while loading', () => {
      mockUseRecommendations.mockReturnValue({
        recommendations: mockRecommendations,
        loading: true,
        error: null,
        refetch: jest.fn(),
        trackClick: jest.fn(),
        trackPurchase: jest.fn(),
      });

      render(<ProductRecommendations {...defaultProps} />);

      expect(screen.queryByText('Recommended for you')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should not render anything when error occurs', () => {
      mockUseRecommendations.mockReturnValue({
        recommendations: [],
        loading: false,
        error: new Error('Failed to fetch'),
        refetch: jest.fn(),
        trackClick: jest.fn(),
        trackPurchase: jest.fn(),
      });

      const { container } = render(<ProductRecommendations {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Empty State', () => {
    it('should not render when no recommendations', () => {
      mockUseRecommendations.mockReturnValue({
        recommendations: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
        trackClick: jest.fn(),
        trackPurchase: jest.fn(),
      });

      const { container } = render(<ProductRecommendations {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Recommendation Display', () => {
    beforeEach(() => {
      mockUseRecommendations.mockReturnValue({
        recommendations: mockRecommendations,
        loading: false,
        error: null,
        refetch: jest.fn(),
        trackClick: jest.fn(),
        trackPurchase: jest.fn(),
      });
    });

    it('should render recommendation title', () => {
      render(<ProductRecommendations {...defaultProps} />);

      expect(screen.getByText('Recommended for you')).toBeInTheDocument();
    });

    it('should display algorithm badge', () => {
      render(<ProductRecommendations {...defaultProps} />);

      expect(screen.getByText('hybrid')).toBeInTheDocument();
    });

    it('should show first recommendation by default', () => {
      render(<ProductRecommendations {...defaultProps} />);

      expect(screen.getByText('product-1')).toBeInTheDocument();
      expect(
        screen.getByText('Highly recommended based on multiple factors')
      ).toBeInTheDocument();
    });

    it('should show View Product button', () => {
      render(<ProductRecommendations {...defaultProps} />);

      expect(screen.getByRole('button', { name: /view product/i })).toBeInTheDocument();
    });

    it('should show info tooltip button', () => {
      render(<ProductRecommendations {...defaultProps} />);

      const infoButtons = screen.getAllByRole('button');
      expect(infoButtons.some(btn => btn.querySelector('svg'))).toBe(true);
    });
  });

  describe('Carousel Navigation', () => {
    beforeEach(() => {
      mockUseRecommendations.mockReturnValue({
        recommendations: mockRecommendations,
        loading: false,
        error: null,
        refetch: jest.fn(),
        trackClick: jest.fn(),
        trackPurchase: jest.fn(),
      });
    });

    it('should show navigation controls when multiple recommendations', () => {
      render(<ProductRecommendations {...defaultProps} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should navigate to next recommendation', () => {
      render(<ProductRecommendations {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next recommendation/i });
      fireEvent.click(nextButton);

      expect(screen.getByText('product-2')).toBeInTheDocument();
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should navigate to previous recommendation', () => {
      render(<ProductRecommendations {...defaultProps} />);

      // Go to second item first
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn =>
        btn.querySelector('svg') && !btn.textContent?.includes('View')
      );
      fireEvent.click(nextButton!);

      // Then go back
      const prevButton = buttons.find(btn =>
        btn.querySelector('svg') && !btn.textContent?.includes('View')
      );
      fireEvent.click(prevButton!);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should wrap around from last to first', () => {
      render(<ProductRecommendations {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons[buttons.length - 1]; // Last button is usually next

      // Click 3 times to go from 1 -> 2 -> 3 -> 1
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should wrap around from first to last', () => {
      render(<ProductRecommendations {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons[buttons.length - 2]; // Second to last is usually prev

      fireEvent.click(prevButton);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
      expect(screen.getByText('product-3')).toBeInTheDocument();
    });
  });

  describe('Click Tracking', () => {
    it('should track click when View Product is clicked', async () => {
      const mockTrackClick = jest.fn().mockResolvedValue(undefined);

      mockUseRecommendations.mockReturnValue({
        recommendations: mockRecommendations,
        loading: false,
        error: null,
        refetch: jest.fn(),
        trackClick: mockTrackClick,
        trackPurchase: jest.fn(),
      });

      render(<ProductRecommendations {...defaultProps} />);

      const viewButton = screen.getByRole('button', { name: /view product/i });
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(mockTrackClick).toHaveBeenCalledWith('product-1');
      });
    });

    it('should call onProductClick callback', async () => {
      const mockOnProductClick = jest.fn();

      mockUseRecommendations.mockReturnValue({
        recommendations: mockRecommendations,
        loading: false,
        error: null,
        refetch: jest.fn(),
        trackClick: jest.fn().mockResolvedValue(undefined),
        trackPurchase: jest.fn(),
      });

      render(
        <ProductRecommendations
          {...defaultProps}
          onProductClick={mockOnProductClick}
        />
      );

      const viewButton = screen.getByRole('button', { name: /view product/i });
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(mockOnProductClick).toHaveBeenCalledWith('product-1');
      });
    });
  });

  describe('Single Recommendation', () => {
    it('should not show navigation controls with single recommendation', () => {
      mockUseRecommendations.mockReturnValue({
        recommendations: [mockRecommendations[0]],
        loading: false,
        error: null,
        refetch: jest.fn(),
        trackClick: jest.fn(),
        trackPurchase: jest.fn(),
      });

      render(<ProductRecommendations {...defaultProps} />);

      expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
    });
  });
});
