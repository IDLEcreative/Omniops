import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcut {
  keys: string;
  description: string;
}

interface KeyboardShortcutsModalProps {
  shortcuts: KeyboardShortcut[];
}

/**
 * Modal component that displays available keyboard shortcuts
 * Shows a help dialog with all keyboard shortcuts and their descriptions
 */
export function KeyboardShortcutsModal({ shortcuts }: KeyboardShortcutsModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Show keyboard shortcuts">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
