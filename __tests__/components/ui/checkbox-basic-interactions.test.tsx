import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Checkbox } from '@/components/ui/checkbox';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Checkbox Component - Basic & Interactions', () => {
  describe('Rendering', () => {
    it('should render checkbox input', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should render with proper type attribute', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.type).toBe('checkbox');
    });

    it('should render with default unchecked state', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('States', () => {
    it('should render in checked state', () => {
      render(<Checkbox defaultChecked />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should render in unchecked state', () => {
      render(<Checkbox defaultChecked={false} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should render disabled state', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox).toBeDisabled();
    });

    it('should not be interactive when disabled', async () => {
      const handleChange = jest.fn();
      render(<Checkbox disabled onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      const user = userEvent.setup();
      await user.click(checkbox);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should toggle checked state on click', async () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

      expect(checkbox.checked).toBe(false);

      const user = userEvent.setup();
      await user.click(checkbox);

      expect(checkbox.checked).toBe(true);
    });

    it('should call onChange handler when clicked', async () => {
      const handleChange = jest.fn();
      render(<Checkbox onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      const user = userEvent.setup();
      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalled();
    });

    it('should toggle multiple times', async () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

      const user = userEvent.setup();

      expect(checkbox.checked).toBe(false);
      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('should handle keyboard activation with space', async () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

      checkbox.focus();
      const user = userEvent.setup();
      await user.keyboard(' ');

      expect(checkbox.checked).toBe(true);
    });

    it('should handle keyboard activation with Enter', async () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

      checkbox.focus();
      const user = userEvent.setup();
      await user.keyboard('{Enter}');

      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper checkbox role', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.tagName).toBe('INPUT');
    });

    it('should support aria-label', () => {
      render(<Checkbox aria-label="Accept terms" />);
      const checkbox = screen.getByLabelText('Accept terms');
      expect(checkbox).toBeInTheDocument();
    });

    it('should be focusable', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();
      expect(checkbox).toHaveFocus();
    });

    it('should have aria-checked attribute', () => {
      const { rerender } = render(<Checkbox defaultChecked={false} />);
      let checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');

      rerender(<Checkbox defaultChecked={true} />);
      checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('should support aria-disabled when disabled', () => {
      render(<Checkbox disabled aria-disabled="true" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Checkbox aria-describedby="help-text" />
          <span id="help-text">Help information</span>
        </>
      );
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-describedby', 'help-text');
    });
  });
});
