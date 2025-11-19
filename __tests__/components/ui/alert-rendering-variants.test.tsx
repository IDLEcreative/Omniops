import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert Component - Rendering & Variants', () => {
  describe('Rendering', () => {
    it('should render alert container', () => {
      const { container } = render(<Alert>Alert content</Alert>);
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('should render with proper role for accessibility', () => {
      const { container } = render(<Alert>Alert</Alert>);
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveAttribute('role', 'alert');
    });

    it('should render default variant', () => {
      const { container } = render(<Alert>Default Alert</Alert>);
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('AlertTitle', () => {
    it('should render alert title', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('should apply title styling', () => {
      render(
        <Alert>
          <AlertTitle>Important</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Important');
      expect(title).toHaveClass('font-medium');
    });

    it('should render title with proper font weight', () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Title');
      expect(title.className).toContain('font-medium');
    });
  });

  describe('AlertDescription', () => {
    it('should render alert description', () => {
      render(
        <Alert>
          <AlertDescription>Alert description text</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Alert description text')).toBeInTheDocument();
    });

    it('should apply description styling', () => {
      render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      const description = screen.getByText('Description');
      expect(description).toHaveClass('text-sm');
    });

    it('should maintain text color in descriptions', () => {
      render(
        <Alert>
          <AlertDescription>Details</AlertDescription>
        </Alert>
      );
      const description = screen.getByText('Details');
      expect(description.className).toContain('text-');
    });
  });

  describe('Alert Variants', () => {
    it('should render default variant alert', () => {
      const { container } = render(
        <Alert variant="default">
          <AlertTitle>Default</AlertTitle>
          <AlertDescription>Default alert</AlertDescription>
        </Alert>
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('should render destructive variant alert', () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should apply destructive styling to destructive variant', () => {
      const { container } = render(
        <Alert variant="destructive">
          <AlertTitle>Destructive</AlertTitle>
        </Alert>
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toContain('destructive');
    });

    it('should apply default styling when no variant specified', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Default</AlertTitle>
        </Alert>
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).not.toContain('destructive');
    });
  });

  describe('Full Alert Composition', () => {
    it('should render complete alert with title and description', () => {
      render(
        <Alert>
          <AlertTitle>Heads Up!</AlertTitle>
          <AlertDescription>
            You can add components to the right side of an alert to add an action button.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Heads Up!')).toBeInTheDocument();
      expect(screen.getByText(/You can add components/)).toBeInTheDocument();
    });

    it('should render alert with only description', () => {
      render(
        <Alert>
          <AlertDescription>This is just a description</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('This is just a description')).toBeInTheDocument();
    });

    it('should render alert with multiple content pieces', () => {
      render(
        <Alert>
          <AlertTitle>Multiple Content</AlertTitle>
          <AlertDescription>First line of description</AlertDescription>
          <AlertDescription>Second line of description</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Multiple Content')).toBeInTheDocument();
      expect(screen.getByText('First line of description')).toBeInTheDocument();
      expect(screen.getByText('Second line of description')).toBeInTheDocument();
    });
  });

  describe('Error Alert', () => {
    it('should render error alert with destructive variant', () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>An error occurred while processing your request.</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
    });

    it('should display error details', () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>Please check the following fields: email, password</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Validation Error')).toBeInTheDocument();
      expect(screen.getByText(/Please check/)).toBeInTheDocument();
    });
  });

  describe('Success Alert', () => {
    it('should render success alert', () => {
      render(
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Your changes have been saved successfully.</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText(/changes have been saved/)).toBeInTheDocument();
    });
  });

  describe('Warning Alert', () => {
    it('should render warning alert', () => {
      render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>This action cannot be undone.</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    });
  });

  describe('Info Alert', () => {
    it('should render info alert', () => {
      render(
        <Alert>
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>Please note the following information.</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(screen.getByText(/please note/i)).toBeInTheDocument();
    });
  });
});
