import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Button } from '@/components/ui/button';
import userEvent from '@testing-library/user-event';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with default variant', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('should render with primary variant', () => {
      render(<Button variant="default">Primary Button</Button>);
      const button = screen.getByRole('button', { name: /primary button/i });
      expect(button).toHaveClass('bg-primary');
    });

    it('should render with secondary variant', () => {
      render(<Button variant="secondary">Secondary Button</Button>);
      const button = screen.getByRole('button', { name: /secondary button/i });
      expect(button).toHaveClass('bg-secondary');
    });

    it('should render with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button', { name: /delete/i });
      expect(button).toHaveClass('bg-destructive');
    });

    it('should render with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button', { name: /outline/i });
      expect(button).toHaveClass('border');
    });

    it('should render with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button', { name: /ghost/i });
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('should render with link variant', () => {
      render(<Button variant="link">Link Button</Button>);
      const button = screen.getByRole('button', { name: /link button/i });
      expect(button).toHaveClass('text-primary');
    });
  });

  describe('Sizes', () => {
    it('should render with default size', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button', { name: /default size/i });
      expect(button).toHaveClass('h-9');
    });

    it('should render with small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button', { name: /small/i });
      expect(button).toHaveClass('h-8');
    });

    it('should render with large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button', { name: /large/i });
      expect(button).toHaveClass('h-10');
    });

    it('should render with icon size', () => {
      render(<Button size="icon">📝</Button>);
      const button = screen.getByRole('button', { name: /📝/i });
      expect(button).toHaveClass('size-9');
    });
  });

  describe('States', () => {
    it('should render disabled button', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button', { name: /disabled button/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should not be clickable when disabled', async () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });

      const user = userEvent.setup();
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have focus-visible ring', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button', { name: /focusable/i });
      expect(button.className).toContain('focus-visible:ring');
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });

      const user = userEvent.setup();
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard activation', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Press Enter</Button>);
      const button = screen.getByRole('button', { name: /press enter/i });

      button.focus();
      expect(button).toHaveFocus();

      const user = userEvent.setup();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });

    it('should handle space bar activation', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Press Space</Button>);
      const button = screen.getByRole('button', { name: /press space/i });

      button.focus();
      const user = userEvent.setup();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<Button>Accessible Button</Button>);
      const button = screen.getByRole('button', { name: /accessible button/i });
      expect(button.tagName).toBe('BUTTON');
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Custom label">X</Button>);
      const button = screen.getByRole('button', { name: /custom label/i });
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should support aria-disabled', () => {
      render(<Button aria-disabled="true">Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button', { name: /custom/i });
      expect(button).toHaveClass('custom-class');
    });

    it('should support data attributes', () => {
      render(<Button data-testid="custom-button">Test</Button>);
      const button = screen.getByTestId('custom-button');
      expect(button).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Button>Slotted</Button>);
      const button = screen.getByRole('button', { name: /slotted/i });
      expect(button).toHaveAttribute('data-slot', 'button');
    });
  });

  describe('Multiple Buttons', () => {
    it('should render multiple buttons independently', () => {
      render(
        <>
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </>
      );

      expect(screen.getByRole('button', { name: /first/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /second/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /third/i })).toBeInTheDocument();
    });

    it('should handle clicks on each button independently', async () => {
      const onClick1 = jest.fn();
      const onClick2 = jest.fn();

      render(
        <>
          <Button onClick={onClick1}>First</Button>
          <Button onClick={onClick2}>Second</Button>
        </>
      );

      const user = userEvent.setup();
      const first = screen.getByRole('button', { name: /first/i });
      const second = screen.getByRole('button', { name: /second/i });

      await user.click(first);
      await user.click(second);

      expect(onClick1).toHaveBeenCalledTimes(1);
      expect(onClick2).toHaveBeenCalledTimes(1);
    });
  });
});
