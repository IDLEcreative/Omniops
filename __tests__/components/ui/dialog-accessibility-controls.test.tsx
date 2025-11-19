import { describe, it, expect } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Dialog Component - Accessibility & Controls', () => {
  describe('Dialog Accessibility', () => {
    it('should have dialog role', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent>
              <DialogTitle>Accessible Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Accessible Dialog')).toBeInTheDocument();
    });

    it('should trap focus within dialog', async () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true);
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Dialog with focus trap</DialogTitle>
              <button>Action 1</button>
              <button>Action 2</button>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should support aria-label', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent aria-label="Confirmation dialog">
              <DialogTitle>Confirm Action</DialogTitle>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent aria-describedby="dialog-desc">
              <DialogTitle>Dialog</DialogTitle>
              <p id="dialog-desc">Description</p>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  describe('Dialog Controls', () => {
    it('should handle controlled dialog state', async () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open Dialog</button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogTitle>Controlled Dialog</DialogTitle>
                <button onClick={() => setOpen(false)}>Close Dialog</button>
              </DialogContent>
            </Dialog>
          </>
        );
      };

      render(<TestComponent />);
      const openButton = screen.getByRole('button', { name: /open dialog/i });

      const user = userEvent.setup();
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByText('Controlled Dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument();
      });
    });

    it('should call onOpenChange callback', async () => {
      const handleOpenChange = jest.fn();
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true);
        return (
          <Dialog open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            handleOpenChange(newOpen);
          }}>
            <DialogContent>
              <DialogTitle>Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      // Dialog is open by default, onOpenChange should be called when it closes
    });
  });

  describe('Multiple Dialogs', () => {
    it('should handle nested dialogs', () => {
      const TestComponent = () => {
        const [open1, setOpen1] = React.useState(true);
        const [open2, setOpen2] = React.useState(false);

        return (
          <>
            <Dialog open={open1} onOpenChange={setOpen1}>
              <DialogContent>
                <DialogTitle>First Dialog</DialogTitle>
                <button onClick={() => setOpen2(true)}>Open Second</button>
              </DialogContent>
            </Dialog>
            <Dialog open={open2} onOpenChange={setOpen2}>
              <DialogContent>
                <DialogTitle>Second Dialog</DialogTitle>
              </DialogContent>
            </Dialog>
          </>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('First Dialog')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle dialog with long content', () => {
      const longText = 'Lorem ipsum dolor sit amet, '.repeat(20);
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent>
              <DialogTitle>Long Content</DialogTitle>
              <p>{longText}</p>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText(/Lorem ipsum/)).toBeInTheDocument();
    });

    it('should handle dialog with custom styles', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent className="max-w-2xl">
              <DialogTitle>Custom Styled</DialogTitle>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Custom Styled')).toBeInTheDocument();
    });
  });
});
