import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>Default Badge</Badge>);
      expect(screen.getByText('Default Badge')).toBeInTheDocument();
    });

    it('should render with default variant', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.querySelector('[data-slot="badge"]') || screen.getByText('Default');
      expect(badge).toBeInTheDocument();
    });

    it('should apply default styling', () => {
      const { container } = render(<Badge>Styled Badge</Badge>);
      const badge = screen.getByText('Styled Badge');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('gap-2');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toBeInTheDocument();
    });

    it('should render secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary');
    });

    it('should render destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-destructive');
    });

    it('should render outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('border');
    });

    it('should apply correct default variant if none specified', () => {
      render(<Badge>No Variant</Badge>);
      const badge = screen.getByText('No Variant');
      expect(badge).toHaveClass('bg-primary');
    });
  });

  describe('Content', () => {
    it('should render text content', () => {
      render(<Badge>Text Badge</Badge>);
      expect(screen.getByText('Text Badge')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      render(
        <Badge>
          <span>✓</span> Verified
        </Badge>
      );
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should render with multiple children', () => {
      render(
        <Badge>
          <span>Status:</span>
          <strong>Active</strong>
        </Badge>
      );
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render with empty content', () => {
      const { container } = render(<Badge />);
      const badge = container.querySelector('span');
      expect(badge).toBeInTheDocument();
    });

    it('should handle long text', () => {
      const longText = 'This is a very long badge text that should still render properly';
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<Badge>@user #tag</Badge>);
      expect(screen.getByText('@user #tag')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should accept custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-class');
    });

    it('should support data attributes', () => {
      render(<Badge data-testid="custom-badge">Test</Badge>);
      const badge = screen.getByTestId('custom-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should have gap spacing for multiple children', () => {
      const { container } = render(
        <Badge>
          <span>Icon</span>
          <span>Text</span>
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('gap-2');
    });
  });

  describe('Accessibility', () => {
    it('should be readable by screen readers', () => {
      render(<Badge>Important</Badge>);
      const badge = screen.getByText('Important');
      expect(badge).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Badge aria-label="New notification">New</Badge>);
      const badge = screen.getByLabelText('New notification');
      expect(badge).toBeInTheDocument();
    });

    it('should maintain semantic structure', () => {
      const { container } = render(<Badge>Badge Content</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.tagName).toBe('SPAN');
    });
  });

  describe('Multiple Badges', () => {
    it('should render multiple badges independently', () => {
      render(
        <div>
          <Badge>Badge 1</Badge>
          <Badge variant="secondary">Badge 2</Badge>
          <Badge variant="destructive">Badge 3</Badge>
        </div>
      );

      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
    });

    it('should apply different variants correctly', () => {
      render(
        <div>
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      );

      const defaultBadge = screen.getByText('Default');
      const secondaryBadge = screen.getByText('Secondary');
      const destructiveBadge = screen.getByText('Destructive');
      const outlineBadge = screen.getByText('Outline');

      expect(defaultBadge).toHaveClass('bg-primary');
      expect(secondaryBadge).toHaveClass('bg-secondary');
      expect(destructiveBadge).toHaveClass('bg-destructive');
      expect(outlineBadge).toHaveClass('border');
    });
  });

  describe('Status Indicators', () => {
    it('should display active status', () => {
      render(<Badge variant="default">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display inactive status', () => {
      render(<Badge variant="secondary">Inactive</Badge>);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should display error status', () => {
      render(<Badge variant="destructive">Error</Badge>);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should display pending status', () => {
      render(<Badge variant="outline">Pending</Badge>);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle numeric content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle boolean-like content', () => {
      render(
        <Badge>
          {true ? 'Enabled' : 'Disabled'}
        </Badge>
      );
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });

    it('should render with span element', () => {
      const { container } = render(<Badge>Span Badge</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.tagName).toBe('SPAN');
    });
  });

  describe('Usage in Lists', () => {
    it('should render correctly in a list', () => {
      render(
        <div>
          <div>
            <Badge>Tag 1</Badge>
          </div>
          <div>
            <Badge>Tag 2</Badge>
          </div>
          <div>
            <Badge>Tag 3</Badge>
          </div>
        </div>
      );

      expect(screen.getByText('Tag 1')).toBeInTheDocument();
      expect(screen.getByText('Tag 2')).toBeInTheDocument();
      expect(screen.getByText('Tag 3')).toBeInTheDocument();
    });

    it('should maintain variant styling in lists', () => {
      render(
        <div>
          <Badge variant="secondary">Secondary 1</Badge>
          <Badge variant="secondary">Secondary 2</Badge>
          <Badge variant="secondary">Secondary 3</Badge>
        </div>
      );

      const badges = screen.getAllByText(/Secondary/);
      badges.forEach(badge => {
        expect(badge).toHaveClass('bg-secondary');
      });
    });
  });
});
