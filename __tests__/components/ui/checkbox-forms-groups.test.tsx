import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Checkbox } from '@/components/ui/checkbox';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Checkbox Component - Forms & Groups', () => {
  describe('Props', () => {
    it('should accept checked prop', () => {
      render(<Checkbox checked={true} onChange={() => {}} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should accept defaultChecked prop', () => {
      render(<Checkbox defaultChecked={true} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should accept id prop', () => {
      render(<Checkbox id="unique-checkbox" />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.id).toBe('unique-checkbox');
    });

    it('should accept name prop', () => {
      render(<Checkbox name="consent" />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.name).toBe('consent');
    });

    it('should accept value prop', () => {
      render(<Checkbox value="accept-terms" />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.value).toBe('accept-terms');
    });

    it('should accept custom className', () => {
      render(<Checkbox className="custom-checkbox" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('custom-checkbox');
    });

    it('should accept data attributes', () => {
      render(<Checkbox data-testid="custom-checkbox" />);
      const checkbox = screen.getByTestId('custom-checkbox');
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Form Integration', () => {
    it('should submit with form', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Checkbox name="agree" value="yes" defaultChecked />
          <button type="submit">Submit</button>
        </form>
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should work with form data', () => {
      render(
        <form>
          <Checkbox name="option1" value="val1" defaultChecked />
          <Checkbox name="option2" value="val2" />
        </form>
      );

      const checkbox1 = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox1.checked).toBe(true);
      expect(checkbox1.value).toBe('val1');
    });

    it('should be part of a form submission', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <label>
            <Checkbox name="terms" />
            I agree to terms
          </label>
          <button type="submit">Submit</button>
        </form>
      );

      const user = userEvent.setup();
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Multiple Checkboxes', () => {
    it('should render multiple checkboxes independently', () => {
      render(
        <div>
          <Checkbox id="opt1" name="options" value="1" />
          <Checkbox id="opt2" name="options" value="2" />
          <Checkbox id="opt3" name="options" value="3" />
        </div>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });

    it('should handle independent state for multiple checkboxes', async () => {
      render(
        <div>
          <Checkbox id="cb1" defaultChecked={false} />
          <Checkbox id="cb2" defaultChecked={true} />
          <Checkbox id="cb3" defaultChecked={false} />
        </div>
      );

      const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true);
      expect(checkboxes[2].checked).toBe(false);
    });

    it('should handle clicks on multiple checkboxes independently', async () => {
      const handleChange1 = jest.fn();
      const handleChange2 = jest.fn();

      render(
        <div>
          <Checkbox onChange={handleChange1} />
          <Checkbox onChange={handleChange2} />
        </div>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const user = userEvent.setup();

      await user.click(checkboxes[0]);
      expect(handleChange1).toHaveBeenCalledTimes(1);
      expect(handleChange2).not.toHaveBeenCalled();

      await user.click(checkboxes[1]);
      expect(handleChange1).toHaveBeenCalledTimes(1);
      expect(handleChange2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Checkbox Groups', () => {
    it('should handle checkbox group selection', async () => {
      render(
        <fieldset>
          <legend>Select options:</legend>
          <label>
            <Checkbox name="group" value="a" />
            Option A
          </label>
          <label>
            <Checkbox name="group" value="b" />
            Option B
          </label>
          <label>
            <Checkbox name="group" value="c" />
            Option C
          </label>
        </fieldset>
      );

      const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
      const user = userEvent.setup();

      await user.click(checkboxes[0]);
      await user.click(checkboxes[2]);

      expect(checkboxes[0].checked).toBe(true);
      expect(checkboxes[1].checked).toBe(false);
      expect(checkboxes[2].checked).toBe(true);
    });
  });

  describe('Controlled Component', () => {
    it('should work as controlled component', async () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false);
        return (
          <>
            <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <div>{checked ? 'Checked' : 'Unchecked'}</div>
          </>
        );
      };

      render(<TestComponent />);
      const checkbox = screen.getByRole('checkbox');
      const display = screen.getByText('Unchecked');

      expect(display).toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(checkbox);

      expect(screen.getByText('Checked')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicking', async () => {
      const handleChange = jest.fn();
      render(<Checkbox onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      const user = userEvent.setup();
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it('should handle required attribute', () => {
      render(<Checkbox required />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox).toHaveAttribute('required');
    });

    it('should work without explicit id', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });
  });
});
