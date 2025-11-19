import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert Component - Accessibility & Edge Cases', () => {
  describe('Accessibility', () => {
    it('should have proper alert role', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Alert</AlertTitle>
        </Alert>
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveAttribute('role', 'alert');
    });

    it('should announce alert to screen readers', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>This is important information</AlertDescription>
        </Alert>
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.getAttribute('role')).toBe('alert');
    });

    it('should support aria-label', () => {
      const { container } = render(
        <Alert aria-label="System notification">
          <AlertDescription>System is updating</AlertDescription>
        </Alert>
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveAttribute('aria-label', 'System notification');
    });

    it('should support aria-describedby', () => {
      render(
        <Alert aria-describedby="desc">
          <AlertTitle>Alert</AlertTitle>
          <AlertDescription id="desc">Description</AlertDescription>
        </Alert>
      );
      const description = screen.getByText('Description');
      expect(description).toHaveAttribute('id', 'desc');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className on Alert', () => {
      const { container } = render(
        <Alert className="custom-alert">
          <AlertTitle>Custom</AlertTitle>
        </Alert>
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('custom-alert');
    });

    it('should accept custom className on AlertTitle', () => {
      render(
        <Alert>
          <AlertTitle className="custom-title">Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });

    it('should accept custom className on AlertDescription', () => {
      render(
        <Alert>
          <AlertDescription className="custom-desc">Description</AlertDescription>
        </Alert>
      );
      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('Multiple Alerts', () => {
    it('should render multiple alerts independently', () => {
      render(
        <div>
          <Alert>
            <AlertTitle>Alert 1</AlertTitle>
          </Alert>
          <Alert>
            <AlertTitle>Alert 2</AlertTitle>
          </Alert>
          <Alert>
            <AlertTitle>Alert 3</AlertTitle>
          </Alert>
        </div>
      );

      expect(screen.getByText('Alert 1')).toBeInTheDocument();
      expect(screen.getByText('Alert 2')).toBeInTheDocument();
      expect(screen.getByText('Alert 3')).toBeInTheDocument();
    });

    it('should maintain individual variant styling for multiple alerts', () => {
      const { container } = render(
        <div>
          <Alert variant="default">
            <AlertTitle>Default</AlertTitle>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Destructive</AlertTitle>
          </Alert>
        </div>
      );

      const alerts = container.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long content', () => {
      const longText = 'This is a very long alert description that contains a lot of text and should wrap properly without breaking the layout.';
      render(
        <Alert>
          <AlertTitle>Long Alert</AlertTitle>
          <AlertDescription>{longText}</AlertDescription>
        </Alert>
      );
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle empty alert', () => {
      const { container } = render(<Alert />);
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      render(
        <Alert>
          <AlertTitle>Special Chars: @#$%</AlertTitle>
          <AlertDescription>Content with &amp; special &lt;chars&gt;</AlertDescription>
        </Alert>
      );
      expect(screen.getByText(/Special Chars/)).toBeInTheDocument();
    });
  });
});
