import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

describe('Card Component - Components & Composition', () => {
  describe('Card Rendering', () => {
    it('should render card container', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('[data-slot="card"]') || container.firstChild;
      expect(card).toBeInTheDocument();
    });

    it('should render with default styling', () => {
      const { container } = render(<Card>Card content</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
    });

    it('should apply shadow styling', () => {
      const { container } = render(<Card>Shadow Card</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card?.className).toContain('bg-');
    });
  });

  describe('CardHeader', () => {
    it('should render header section', () => {
      const { container } = render(
        <Card>
          <CardHeader>Header Content</CardHeader>
        </Card>
      );
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should apply header padding', () => {
      const { container } = render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>
      );
      const header = screen.getByText('Header').parentElement;
      expect(header).toHaveClass('flex');
    });

    it('should render header with title and description', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should apply title styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
    });

    it('should render with proper heading element', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Heading</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByText('Heading');
      expect(title).toBeInTheDocument();
    });
  });

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Card description text')).toBeInTheDocument();
    });

    it('should apply description styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      );
      const description = screen.getByText('Description');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('should render card content section', () => {
      render(
        <Card>
          <CardContent>Main content</CardContent>
        </Card>
      );
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('should apply content padding', () => {
      const { container } = render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('px-6');
    });

    it('should render with rich content', () => {
      render(
        <Card>
          <CardContent>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </CardContent>
        </Card>
      );
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });
  });

  describe('CardFooter', () => {
    it('should render footer section', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should apply footer styling', () => {
      const { container } = render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>
      );
      const footer = screen.getByText('Footer');
      expect(footer.className).toContain('flex');
    });

    it('should render footer with action buttons', () => {
      render(
        <Card>
          <CardFooter>
            <button>Cancel</button>
            <button>Save</button>
          </CardFooter>
        </Card>
      );
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  describe('Complete Card Composition', () => {
    it('should render complete card with all sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>A full card example</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Complete Card')).toBeInTheDocument();
      expect(screen.getByText('A full card example')).toBeInTheDocument();
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });

    it('should render card with only header and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>Content only</CardContent>
        </Card>
      );

      expect(screen.getByText('Simple Card')).toBeInTheDocument();
      expect(screen.getByText('Content only')).toBeInTheDocument();
    });

    it('should render card with only content', () => {
      render(
        <Card>
          <CardContent>Minimal card</CardContent>
        </Card>
      );

      expect(screen.getByText('Minimal card')).toBeInTheDocument();
    });
  });
});
