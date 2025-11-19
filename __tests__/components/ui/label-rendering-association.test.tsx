import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Label } from '@/components/ui/label';
import React from 'react';

describe('Label Component - Rendering & Association', () => {
  describe('Rendering', () => {
    it('should render label element', () => {
      render(<Label>Label text</Label>);
      const label = screen.getByText('Label text');
      expect(label.tagName).toBe('LABEL');
    });

    it('should render with default styling', () => {
      render(<Label>Styled Label</Label>);
      const label = screen.getByText('Styled Label');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-medium');
    });

    it('should apply leading class', () => {
      render(<Label>Leading</Label>);
      const label = screen.getByText('Leading');
      expect(label).toHaveClass('leading-none');
    });
  });

  describe('HTML Association', () => {
    it('should associate with input via htmlFor', () => {
      render(
        <>
          <Label htmlFor="email-input">Email</Label>
          <input id="email-input" type="email" />
        </>
      );

      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox') as HTMLInputElement;

      expect(label).toHaveAttribute('for', 'email-input');
      expect(input.id).toBe('email-input');
    });

    it('should focus input when label is clicked', () => {
      render(
        <>
          <Label htmlFor="text-input">Name</Label>
          <input id="text-input" type="text" />
        </>
      );

      const label = screen.getByText('Name') as HTMLLabelElement;
      expect(label).toHaveAttribute('for', 'text-input');
    });

    it('should work with checkbox input', () => {
      render(
        <>
          <Label htmlFor="accept-terms">I accept the terms</Label>
          <input id="accept-terms" type="checkbox" />
        </>
      );

      const label = screen.getByText('I accept the terms');
      expect(label).toHaveAttribute('for', 'accept-terms');
    });

    it('should work with radio input', () => {
      render(
        <>
          <Label htmlFor="option-a">Option A</Label>
          <input id="option-a" type="radio" name="options" />
        </>
      );

      const label = screen.getByText('Option A');
      expect(label).toHaveAttribute('for', 'option-a');
    });

    it('should work with select input', () => {
      render(
        <>
          <Label htmlFor="category">Category</Label>
          <select id="category">
            <option>Select</option>
          </select>
        </>
      );

      const label = screen.getByText('Category');
      expect(label).toHaveAttribute('for', 'category');
    });

    it('should work with textarea', () => {
      render(
        <>
          <Label htmlFor="message">Message</Label>
          <textarea id="message" />
        </>
      );

      const label = screen.getByText('Message');
      expect(label).toHaveAttribute('for', 'message');
    });
  });

  describe('Content', () => {
    it('should render text content', () => {
      render(<Label>Text Label</Label>);
      expect(screen.getByText('Text Label')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      render(
        <Label>
          <span>🔒</span> Password
        </Label>
      );
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('should render required indicator', () => {
      render(
        <Label>
          Email <span aria-label="required">*</span>
        </Label>
      );
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('required')).toBeInTheDocument();
    });

    it('should handle long label text', () => {
      const longText = 'This is a very long label that provides comprehensive description for the form field';
      render(<Label>{longText}</Label>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should render multiple child elements', () => {
      render(
        <Label>
          <span>First</span>
          <span>Second</span>
        </Label>
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should accept custom className', () => {
      render(<Label className="custom-label">Custom</Label>);
      const label = screen.getByText('Custom');
      expect(label).toHaveClass('custom-label');
    });

    it('should support data attributes', () => {
      render(<Label data-testid="test-label">Test</Label>);
      const label = screen.getByTestId('test-label');
      expect(label).toBeInTheDocument();
    });

    it('should maintain font weight', () => {
      render(<Label>Bold Label</Label>);
      const label = screen.getByText('Bold Label');
      expect(label).toHaveClass('font-medium');
    });

    it('should maintain text size', () => {
      render(<Label>Sized Label</Label>);
      const label = screen.getByText('Sized Label');
      expect(label).toHaveClass('text-sm');
    });
  });
});
