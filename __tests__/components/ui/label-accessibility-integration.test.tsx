import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Label } from '@/components/ui/label';
import React from 'react';

describe('Label Component - Accessibility & Integration', () => {
  describe('Accessibility', () => {
    it('should have proper label role', () => {
      render(<Label>Accessible Label</Label>);
      const label = screen.getByText('Accessible Label');
      expect(label.tagName).toBe('LABEL');
    });

    it('should support aria-required', () => {
      render(<Label aria-required="true">Required Field</Label>);
      const label = screen.getByText('Required Field');
      expect(label).toHaveAttribute('aria-required', 'true');
    });

    it('should work with aria-labelledby', () => {
      render(
        <>
          <span id="field-label">Username</span>
          <Label htmlFor="user-input">
            <span aria-labelledby="field-label" />
          </Label>
          <input id="user-input" />
        </>
      );

      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should be readable by screen readers', () => {
      render(
        <>
          <Label htmlFor="email">Email Address</Label>
          <input id="email" type="email" aria-label="Enter your email" />
        </>
      );

      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should associate with input for screen readers', () => {
      render(
        <>
          <Label htmlFor="password">Password</Label>
          <input id="password" type="password" />
        </>
      );

      const label = screen.getByText('Password') as HTMLLabelElement;
      expect(label.htmlFor).toBe('password');
    });
  });

  describe('Form Integration', () => {
    it('should work in form field group', () => {
      render(
        <div>
          <Label htmlFor="username">Username</Label>
          <input id="username" type="text" />
        </div>
      );

      expect(screen.getByText('Username')).toBeInTheDocument();
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.id).toBe('username');
    });

    it('should work with multiple form fields', () => {
      render(
        <>
          <div>
            <Label htmlFor="first-name">First Name</Label>
            <input id="first-name" type="text" />
          </div>
          <div>
            <Label htmlFor="last-name">Last Name</Label>
            <input id="last-name" type="text" />
          </div>
        </>
      );

      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
    });

    it('should work with form validation messages', () => {
      render(
        <>
          <Label htmlFor="email">Email</Label>
          <input id="email" type="email" aria-describedby="email-error" />
          <span id="email-error" role="alert">
            Please enter a valid email
          </span>
        </>
      );

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Label with Different Input Types', () => {
    const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url', 'search'];

    inputTypes.forEach((type) => {
      it(`should work with ${type} input`, () => {
        render(
          <>
            <Label htmlFor={`${type}-input`}>{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
            <input id={`${type}-input`} type={type} />
          </>
        );

        const label = screen.getByText(type.charAt(0).toUpperCase() + type.slice(1));
        expect(label).toHaveAttribute('for', `${type}-input`);
      });
    });
  });

  describe('Multiple Labels', () => {
    it('should render multiple labels independently', () => {
      render(
        <>
          <Label htmlFor="field1">Label 1</Label>
          <Label htmlFor="field2">Label 2</Label>
          <Label htmlFor="field3">Label 3</Label>
        </>
      );

      expect(screen.getByText('Label 1')).toBeInTheDocument();
      expect(screen.getByText('Label 2')).toBeInTheDocument();
      expect(screen.getByText('Label 3')).toBeInTheDocument();
    });

    it('should each associate with different inputs', () => {
      render(
        <>
          <Label htmlFor="input1">Label 1</Label>
          <input id="input1" type="text" />
          <Label htmlFor="input2">Label 2</Label>
          <input id="input2" type="text" />
        </>
      );

      const labels = screen.getAllByText(/Label/);
      expect(labels[0]).toHaveAttribute('for', 'input1');
      expect(labels[1]).toHaveAttribute('for', 'input2');
    });
  });

  describe('Disabled State Integration', () => {
    it('should work with disabled input', () => {
      render(
        <>
          <Label htmlFor="disabled-input">Disabled Field</Label>
          <input id="disabled-input" type="text" disabled />
        </>
      );

      const label = screen.getByText('Disabled Field');
      const input = screen.getByRole('textbox') as HTMLInputElement;

      expect(input).toBeDisabled();
      expect(label).toHaveAttribute('for', 'disabled-input');
    });

    it('should work with disabled select', () => {
      render(
        <>
          <Label htmlFor="disabled-select">Disabled Select</Label>
          <select id="disabled-select" disabled>
            <option>Option</option>
          </select>
        </>
      );

      const label = screen.getByText('Disabled Select');
      expect(label).toHaveAttribute('for', 'disabled-select');
    });
  });

  describe('Error State Integration', () => {
    it('should work with error messages', () => {
      render(
        <>
          <Label htmlFor="email" className="text-destructive">
            Email <span aria-label="required">*</span>
          </Label>
          <input id="email" type="email" aria-invalid="true" />
          <span className="text-destructive" role="alert">
            Email is required
          </span>
        </>
      );

      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox') as HTMLInputElement;

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty label', () => {
      const { container } = render(<Label />);
      const label = container.querySelector('label');
      expect(label).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<Label>Field with @#$% special chars</Label>);
      expect(screen.getByText(/Field with @#\$% special chars/)).toBeInTheDocument();
    });

    it('should handle very long label text without wrapping issues', () => {
      const veryLongText = 'This is a very long label that provides detailed information about what should be entered in the corresponding form field and might wrap to multiple lines';
      render(<Label>{veryLongText}</Label>);
      expect(screen.getByText(veryLongText)).toBeInTheDocument();
    });

    it('should work without htmlFor attribute', () => {
      render(<Label>Standalone Label</Label>);
      expect(screen.getByText('Standalone Label')).toBeInTheDocument();
    });

    it('should handle label with nested components', () => {
      render(
        <Label>
          <strong>Important</strong> Field
        </Label>
      );
      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('Field')).toBeInTheDocument();
    });
  });
});
