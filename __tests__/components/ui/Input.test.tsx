import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Input } from '@/components/ui/input';
import userEvent from '@testing-library/user-event';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder text', () => {
      render(<Input placeholder="Enter text..." />);
      const input = screen.getByPlaceholderText('Enter text...');
      expect(input).toBeInTheDocument();
    });

    it('should render with default classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-9');
    });
  });

  describe('Input Types', () => {
    it('should support text input type', () => {
      render(<Input type="text" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('text');
    });

    it('should support email input type', () => {
      render(<Input type="email" placeholder="email@example.com" />);
      const input = screen.getByPlaceholderText('email@example.com') as HTMLInputElement;
      expect(input.type).toBe('email');
    });

    it('should support password input type', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('password');
    });

    it('should support number input type', () => {
      render(<Input type="number" />);
      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    it('should support search input type', () => {
      render(<Input type="search" />);
      const input = document.querySelector('input[type="search"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should update value on user input', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      const user = userEvent.setup();
      await user.type(input, 'Hello World');

      expect(input.value).toBe('Hello World');
    });

    it('should handle onChange event', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      const user = userEvent.setup();
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
    });

    it('should handle onBlur event', async () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      const user = userEvent.setup();
      await user.click(input);
      await user.keyboard('{Tab}');

      expect(handleBlur).toHaveBeenCalled();
    });

    it('should handle onFocus event', async () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      const user = userEvent.setup();
      await user.click(input);

      expect(handleFocus).toHaveBeenCalled();
    });

    it('should clear text on clear action', async () => {
      render(<Input defaultValue="initial text" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      const user = userEvent.setup();
      await user.clear(input);

      expect(input.value).toBe('');
    });
  });

  describe('States', () => {
    it('should render disabled input', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toBeDisabled();
    });

    it('should not accept input when disabled', async () => {
      render(<Input disabled defaultValue="original" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      const user = userEvent.setup();
      await user.type(input, 'new text');

      expect(input.value).toBe('original');
    });

    it('should render readonly input', () => {
      render(<Input readOnly value="readonly text" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toHaveAttribute('readOnly');
      expect(input.value).toBe('readonly text');
    });

    it('should have placeholder when empty', () => {
      render(<Input placeholder="Type here..." defaultValue="" />);
      const input = screen.getByPlaceholderText('Type here...');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should support required attribute', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toHaveAttribute('required');
    });

    it('should support minLength attribute', () => {
      render(<Input minLength={5} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toHaveAttribute('minLength', '5');
    });

    it('should support maxLength attribute', () => {
      render(<Input maxLength={10} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should support pattern attribute', () => {
      render(<Input pattern="[0-9]{3}" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toHaveAttribute('pattern', '[0-9]{3}');
    });
  });

  describe('Default Values', () => {
    it('should render with defaultValue', () => {
      render(<Input defaultValue="Initial Value" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Initial Value');
    });

    it('should render with value prop', () => {
      render(<Input value="Controlled Value" readOnly />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Controlled Value');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable via keyboard', async () => {
      render(<Input placeholder="Focus me" />);
      const input = screen.getByPlaceholderText('Focus me');

      input.focus();
      expect(input).toHaveFocus();
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Username input" />);
      const input = screen.getByLabelText('Username input');
      expect(input).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="input-help" />
          <span id="input-help">Help text</span>
        </>
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'input-help');
    });

    it('should support aria-invalid for error states', () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should support data attributes', () => {
      render(<Input data-testid="custom-input" />);
      const input = screen.getByTestId('custom-input');
      expect(input).toBeInTheDocument();
    });

    it('should accept autoComplete attribute', () => {
      render(<Input autoComplete="email" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.autoComplete).toBe('email');
    });

    it('should accept name attribute', () => {
      render(<Input name="username" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.name).toBe('username');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input', async () => {
      const longText = 'a'.repeat(500);
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      const user = userEvent.setup();
      await user.type(input, longText);

      expect(input.value).toBe(longText);
    });

    it('should handle special characters', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      const user = userEvent.setup();
      await user.type(input, '!@#$%^&*()_+-=[]{}|;:,.<>?');

      expect(input.value).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?');
    });

    it('should handle paste events', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      const pastedText = 'Pasted content';
      await userEvent.setup().click(input);
      input.value = pastedText;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(handleChange).toHaveBeenCalled();
    });
  });
});
