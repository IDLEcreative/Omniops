/**
 * ProductStory Component Tests
 * Tests haptic feedback, gestures, and animations for product cards
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ProductStory } from '@/components/shopping/ProductStory';
import { ShoppingProduct } from '@/types/shopping';
import * as haptics from '@/lib/haptics';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Next Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

// Mock haptic functions
jest.mock('@/lib/haptics', () => ({
  hapticLight: jest.fn(),
  hapticMedium: jest.fn(),
  hapticHeavy: jest.fn(),
  hapticSuccess: jest.fn(),
  hapticWarning: jest.fn(),
  hapticError: jest.fn(),
  hapticSwipe: jest.fn(),
  hapticProductChange: jest.fn(),
  isHapticSupported: jest.fn(() => true),
}));

describe('ProductStory Component', () => {
  const mockProduct: ShoppingProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    salePrice: 79.99,
    image: '/test-image.jpg',
    permalink: '/product/test',
    stockStatus: 'instock',
    shortDescription: 'Test description',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should trigger haptic feedback on single tap', () => {
    const onExpand = jest.fn();
    const onAddToCart = jest.fn();

    const { container } = render(
      <ProductStory
        product={mockProduct}
        index={0}
        total={3}
        onExpand={onExpand}
        onAddToCart={onAddToCart}
      />
    );

    const story = container.querySelector('[class*="relative h-full"]');
    if (story) {
      fireEvent.click(story);
    }

    // Single tap should trigger medium haptic and expand
    setTimeout(() => {
      expect(haptics.hapticMedium).toHaveBeenCalled();
      expect(onExpand).toHaveBeenCalled();
    }, 50);
  });

  it('should trigger success haptic on double tap (add to cart)', async () => {
    const onExpand = jest.fn();
    const onAddToCart = jest.fn();

    const { container } = render(
      <ProductStory
        product={mockProduct}
        index={0}
        total={3}
        onExpand={onExpand}
        onAddToCart={onAddToCart}
      />
    );

    const story = container.querySelector('[class*="relative h-full"]');
    if (story) {
      // First tap
      fireEvent.click(story);

      // Second tap within 300ms
      await waitFor(() => {
        fireEvent.click(story);
      });
    }

    await waitFor(() => {
      expect(haptics.hapticSuccess).toHaveBeenCalled();
      expect(onAddToCart).toHaveBeenCalledWith('1');
    });
  });

  it('should render sale badge with animation', () => {
    const { getByText } = render(
      <ProductStory
        product={mockProduct}
        index={0}
        total={3}
        onExpand={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    expect(getByText('Sale')).toBeInTheDocument();
  });

  it('should show progress indicators', () => {
    const { container } = render(
      <ProductStory
        product={mockProduct}
        index={1}
        total={3}
        onExpand={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    const progressBars = container.querySelectorAll('[class*="h-0.5 flex-1"]');
    expect(progressBars).toHaveLength(3);
  });
});
