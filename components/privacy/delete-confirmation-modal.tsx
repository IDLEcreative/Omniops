'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => Promise<void>;
  loading?: boolean;
  requirePassword?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  requirePassword = true
}: DeleteConfirmationModalProps) {
  const [password, setPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (requirePassword && !password) {
      setError('Please enter your password to confirm');
      return;
    }

    if (!understood) {
      setError('Please confirm that you understand the consequences');
      return;
    }

    setError(null);

    try {
      await onConfirm(requirePassword ? password : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPassword('');
      setUnderstood(false);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Delete Account Permanently
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please read carefully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Deleting your account will:
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>Permanently delete all your personal data</li>
                <li>Remove all your conversation history</li>
                <li>Cancel any active subscriptions</li>
                <li>Delete all your custom settings and configurations</li>
              </ul>
            </AlertDescription>
          </Alert>

          {requirePassword && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Enter your password to confirm
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox
              id="understood"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
              disabled={loading}
            />
            <Label
              htmlFor="understood"
              className="text-sm font-normal cursor-pointer"
            >
              I understand that this action is permanent and all my data will be deleted forever.
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !understood || (requirePassword && !password)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {loading ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}