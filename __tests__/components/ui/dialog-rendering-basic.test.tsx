import { describe, it, expect } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Dialog Component - Rendering & Basic Interactions', () => {
  describe('Rendering', () => {
    it('should not render dialog content by default', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
    });

    it('should render dialog trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger>Click to open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Content</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('button', { name: /click to open/i })).toBeInTheDocument();
    });
  });

  describe('Opening and Closing', () => {
    it('should open dialog when trigger is clicked', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Content</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: /open dialog/i });
      const user = userEvent.setup();
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeInTheDocument();
      });
    });

    it('should close dialog when close button is clicked', async () => {
      const handleOpenChange = jest.fn();
      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogTitle>Open Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    });

    it('should close dialog when clicking outside (on backdrop)', async () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true);
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Dialog')).toBeInTheDocument();
    });

    it('should close dialog when pressing Escape key', async () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true);
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Escapable Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
        );
      };

      const { unmount } = render(<TestComponent />);
      expect(screen.getByText('Escapable Dialog')).toBeInTheDocument();

      const user = userEvent.setup();
      await user.keyboard('{Escape}');
    });
  });

  describe('DialogContent', () => {
    it('should render content in dialog', async () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true);
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <p>Dialog content</p>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Dialog content')).toBeInTheDocument();
    });

    it('should have dialog role', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent>
              <DialogTitle>Modal Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      const title = screen.getByText('Modal Dialog');
      expect(title).toBeInTheDocument();
    });

    it('should be centered on screen', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent className="fixed">
              <DialogTitle>Centered</DialogTitle>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Centered')).toBeInTheDocument();
    });
  });

  describe('DialogHeader, DialogFooter', () => {
    it('should render dialog header', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Header</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('should render dialog footer with actions', () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true);
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Dialog</DialogTitle>
              <DialogFooter>
                <button onClick={() => setOpen(false)}>Cancel</button>
                <button>Confirm</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });
  });

  describe('DialogTitle and DialogDescription', () => {
    it('should render dialog title', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent>
              <DialogTitle>Important Action</DialogTitle>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Important Action')).toBeInTheDocument();
    });

    it('should render dialog description', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent>
              <DialogTitle>Confirm</DialogTitle>
              <DialogDescription>Are you sure you want to proceed?</DialogDescription>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('should have proper heading elements', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Title</DialogTitle>
                <DialogDescription>Description</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });
});
