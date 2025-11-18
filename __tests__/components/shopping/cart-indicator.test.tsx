/**
 * @jest-environment jsdom
 */
/**
 * CartIndicator Component Tests
 * Tests cart badge rendering, animations, and haptic feedback
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartIndicator } from '@/components/shopping/CartIndicator';
import * as haptics from '@/lib/haptics';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock haptic functions
jest.mock('@/lib/haptics', () => ({
  hapticLight: jest.fn(),
  hapticMedium: jest.fn(),
  hapticSuccess: jest.fn(),
  isHapticSupported: jest.fn(() => true),
}));

describe('CartIndicator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when item count is 0', () => {
    const { container } = render(
      <CartIndicator itemCount={0} onClick={jest.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when item count > 0', () => {
    render(<CartIndicator itemCount={5} onClick={jest.fn()} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should trigger haptic on click', () => {
    const onClick = jest.fn();

    render(<CartIndicator itemCount={3} onClick={onClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(haptics.hapticMedium).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();
  });

  it('should display 99+ for counts over 99', () => {
    render(<CartIndicator itemCount={150} onClick={jest.fn()} />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should pulse animation when count increases', async () => {
    const { rerender } = render(
      <CartIndicator itemCount={1} onClick={jest.fn()} />
    );

    // Increase count
    rerender(<CartIndicator itemCount={2} onClick={jest.fn()} />);

    await waitFor(() => {
      expect(haptics.hapticSuccess).toHaveBeenCalled();
    });
  });

  it('should have proper ARIA labels', () => {
    render(<CartIndicator itemCount={3} onClick={jest.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'View cart with 3 items');
  });
});
