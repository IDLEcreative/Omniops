/**
 * ProductDetail Component Tests
 * Tests product detail view, variant selection, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductDetail } from '@/components/shopping/ProductDetail';
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
  hapticSuccess: jest.fn(),
  hapticError: jest.fn(),
  isHapticSupported: jest.fn(() => true),
}));

describe('ProductDetail Component', () => {
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

  it('should not render when not expanded', () => {
    const { container } = render(
      <ProductDetail
        product={mockProduct}
        isExpanded={false}
        onCollapse={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    // AnimatePresence should not render children when isExpanded is false
    const backdrop = container.querySelector('[class*="bg-black/50"]');
    expect(backdrop).not.toBeInTheDocument();
  });

  it('should render when expanded', () => {
    render(
      <ProductDetail
        product={mockProduct}
        isExpanded={true}
        onCollapse={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$79.99')).toBeInTheDocument();
  });

  it('should trigger haptic on variant selection', () => {
    const productWithVariants: ShoppingProduct = {
      ...mockProduct,
      variants: [
        {
          id: 'size',
          name: 'Size',
          options: ['S', 'M', 'L'],
        },
      ],
    };

    render(
      <ProductDetail
        product={productWithVariants}
        isExpanded={true}
        onCollapse={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    const sizeButton = screen.getByText('M');
    fireEvent.click(sizeButton);

    expect(haptics.hapticLight).toHaveBeenCalled();
  });

  it('should trigger haptic on quantity change', () => {
    render(
      <ProductDetail
        product={mockProduct}
        isExpanded={true}
        onCollapse={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    const increaseButton = screen.getByLabelText('Increase quantity');
    fireEvent.click(increaseButton);

    expect(haptics.hapticLight).toHaveBeenCalled();
  });

  it('should trigger success haptic on add to cart', async () => {
    const onAddToCart = jest.fn();

    render(
      <ProductDetail
        product={mockProduct}
        isExpanded={true}
        onCollapse={jest.fn()}
        onAddToCart={onAddToCart}
      />
    );

    const addButton = screen.getByText('Add to Cart');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(haptics.hapticSuccess).toHaveBeenCalled();
      expect(onAddToCart).toHaveBeenCalledWith('1', 1, {});
    });
  });

  it('should disable button and show correct text when out of stock', () => {
    const outOfStockProduct: ShoppingProduct = {
      ...mockProduct,
      stockStatus: 'outofstock',
    };

    render(
      <ProductDetail
        product={outOfStockProduct}
        isExpanded={true}
        onCollapse={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    const addButton = screen.getByRole('button', { name: 'Out of Stock' });

    // Verify button is disabled
    expect(addButton).toBeDisabled();

    // Verify correct text is displayed
    expect(addButton).toHaveTextContent('Out of Stock');
  });

  it('should display gallery thumbnails when multiple images exist', () => {
    const productWithGallery: ShoppingProduct = {
      ...mockProduct,
      images: ['/img1.jpg', '/img2.jpg', '/img3.jpg'],
    };

    render(
      <ProductDetail
        product={productWithGallery}
        isExpanded={true}
        onCollapse={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    const thumbnails = screen.getAllByAltText(/view \d+/);
    expect(thumbnails).toHaveLength(3);
  });
});

describe('Shopping Component Accessibility', () => {
  const mockProduct: ShoppingProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    image: '/test-image.jpg',
    permalink: '/product/test',
    stockStatus: 'instock',
    shortDescription: 'Test description',
  };

  it('should have proper ARIA labels on quantity buttons', () => {
    render(
      <ProductDetail
        product={mockProduct}
        isExpanded={true}
        onCollapse={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument();
  });

  it('should have close button with aria-label', () => {
    render(
      <ProductDetail
        product={mockProduct}
        isExpanded={true}
        onCollapse={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    const closeButton = screen.getByLabelText('Close product details');
    expect(closeButton).toBeInTheDocument();
  });
});
