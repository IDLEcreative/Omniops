import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

describe('Card Component - Styling, Variants & Edge Cases', () => {
  describe('Card Styling', () => {
    it('should accept custom className', () => {
      const { container } = render(
        <Card className="custom-card">Content</Card>
      );
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('custom-card');
    });

    it('should support data attributes', () => {
      render(
        <Card data-testid="custom-card">
          <CardContent>Test</CardContent>
        </Card>
      );
      const card = screen.getByTestId('custom-card');
      expect(card).toBeInTheDocument();
    });

    it('should maintain rounded corners', () => {
      const { container } = render(<Card>Rounded card</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('rounded-xl');
    });

    it('should have border styling', () => {
      const { container } = render(<Card>Bordered card</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('border');
    });
  });

  describe('Multiple Cards', () => {
    it('should render multiple cards in a grid', () => {
      render(
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Card 2</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Card 3</CardTitle>
            </CardHeader>
          </Card>
        </div>
      );

      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });

    it('should render cards with different content types', () => {
      render(
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Text Card</CardTitle>
            </CardHeader>
            <CardContent>Just text</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Image Card</CardTitle>
            </CardHeader>
            <CardContent>
              <img src="test.jpg" alt="test" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Form Card</CardTitle>
            </CardHeader>
            <CardContent>
              <input type="text" placeholder="Form input" />
            </CardContent>
          </Card>
        </div>
      );

      expect(screen.getByText('Text Card')).toBeInTheDocument();
      expect(screen.getByText('Image Card')).toBeInTheDocument();
      expect(screen.getByText('Form Card')).toBeInTheDocument();
    });
  });

  describe('Card Variants', () => {
    it('should render default card style', () => {
      const { container } = render(<Card>Default</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card?.className).toContain('bg-');
    });

    it('should render card with custom background', () => {
      const { container } = render(
        <Card className="bg-accent">Custom Background</Card>
      );
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('bg-accent');
    });

    it('should render elevated card', () => {
      const { container } = render(
        <Card className="shadow-lg">Elevated</Card>
      );
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('shadow-lg');
    });
  });

  describe('Accessibility', () => {
    it('should maintain semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should support data attributes for testing', () => {
      render(
        <Card data-testid="test-card">
          <CardContent>Testable</CardContent>
        </Card>
      );
      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty card', () => {
      const { container } = render(<Card />);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it('should handle card with very long content', () => {
      const longText = 'a'.repeat(500);
      render(
        <Card>
          <CardContent>{longText}</CardContent>
        </Card>
      );
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle card with nested cards', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Outer Card</CardTitle>
          </CardHeader>
          <CardContent>
            <Card>
              <CardHeader>
                <CardTitle>Inner Card</CardTitle>
              </CardHeader>
            </Card>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Outer Card')).toBeInTheDocument();
      expect(screen.getByText('Inner Card')).toBeInTheDocument();
    });

    it('should handle special characters in titles', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title with @#$% special chars</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText(/Title with @#\$% special chars/)).toBeInTheDocument();
    });
  });
});
