import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Dialog Component - Forms & Patterns', () => {
  describe('Form in Dialog', () => {
    it('should support form submission', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true);
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Form Dialog</DialogTitle>
              <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Enter text" />
                <button type="submit">Submit</button>
              </form>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      const user = userEvent.setup();
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should support form inputs in dialog', async () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true);
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Input Dialog</DialogTitle>
              <input type="email" placeholder="Enter email" />
              <input type="text" placeholder="Enter name" />
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    });
  });

  describe('Confirmation Dialog', () => {
    it('should handle confirmation flow', async () => {
      const handleConfirm = jest.fn();
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true);
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogDescription>Are you sure?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <button onClick={() => setOpen(false)}>Cancel Confirm</button>
                <button
                  onClick={() => {
                    handleConfirm();
                    setOpen(false);
                  }}
                >
                  Confirm Button
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      const confirmButton = screen.getByRole('button', { name: /confirm button/i });

      const user = userEvent.setup();
      await user.click(confirmButton);

      expect(handleConfirm).toHaveBeenCalled();
    });
  });

  describe('Alert Dialog Pattern', () => {
    it('should support alert dialog pattern', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alert</DialogTitle>
              </DialogHeader>
              <DialogDescription>This is an important alert</DialogDescription>
              <button>Acknowledge</button>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Alert')).toBeInTheDocument();
      expect(screen.getByText('This is an important alert')).toBeInTheDocument();
    });
  });
});
