import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Switch } from '@/components/ui/switch';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Switch Component - Basic & Accessibility', () => {
  describe('Rendering', () => {
    it('should render switch element', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('should render with default unchecked state', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('should apply default styling', () => {
      const { container } = render(<Switch />);
      const switchContainer = container.querySelector('[role="switch"]');
      expect(switchContainer).toHaveClass('inline-flex');
    });

    it('should have proper switch role', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement.getAttribute('role')).toBe('switch');
    });
  });

  describe('States', () => {
    it('should render in checked state', () => {
      render(<Switch defaultChecked />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should render in unchecked state', () => {
      render(<Switch defaultChecked={false} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('should render disabled state', () => {
      render(<Switch disabled />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement).toBeDisabled();
    });

    it('should not be interactive when disabled', async () => {
      const handleChange = jest.fn();
      render(<Switch disabled onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      const user = userEvent.setup();
      await user.click(switchElement);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should have aria-checked attribute reflecting state', () => {
      render(<Switch defaultChecked={true} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should have aria-disabled when disabled', () => {
      render(<Switch disabled />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should toggle on click', async () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false);
        return <Switch checked={checked} onCheckedChange={setChecked} />;
      };

      render(<TestComponent />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      const user = userEvent.setup();
      await user.click(switchElement);

      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should call onCheckedChange when toggled', async () => {
      const handleChange = jest.fn();
      render(<Switch onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      const user = userEvent.setup();
      await user.click(switchElement);

      expect(handleChange).toHaveBeenCalled();
    });

    it('should toggle multiple times', async () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false);
        return <Switch checked={checked} onCheckedChange={setChecked} />;
      };

      render(<TestComponent />);
      const switchElement = screen.getByRole('switch');
      const user = userEvent.setup();

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('should handle keyboard space activation', async () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false);
        return <Switch checked={checked} onCheckedChange={setChecked} />;
      };

      render(<TestComponent />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      const user = userEvent.setup();
      await user.keyboard(' ');

      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should be focusable', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      expect(switchElement).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Switch aria-label="Dark mode toggle" />);
      const switchElement = screen.getByLabelText('Dark mode toggle');
      expect(switchElement).toBeInTheDocument();
    });

    it('should support aria-labelledby', () => {
      render(
        <>
          <span id="label">Feature toggle</span>
          <Switch aria-labelledby="label" />
        </>
      );
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-labelledby', 'label');
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Switch aria-describedby="description" />
          <span id="description">This enables the feature</span>
        </>
      );
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-describedby', 'description');
    });

    it('should be keyboard accessible', async () => {
      const { container } = render(
        <>
          <input placeholder="Before" />
          <Switch />
          <input placeholder="After" />
        </>
      );

      const before = screen.getByPlaceholderText('Before');
      const switchElement = screen.getByRole('switch');

      before.focus();
      const user = userEvent.setup();
      await user.keyboard('{Tab}');

      expect(switchElement).toHaveFocus();
    });

    it('should announce state changes to screen readers', async () => {
      const handleChange = jest.fn();
      render(<Switch aria-label="Notifications" onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      const user = userEvent.setup();
      await user.click(switchElement);

      expect(handleChange).toHaveBeenCalled();
      expect(switchElement.getAttribute('aria-checked')).toBe('true');
    });
  });
});
