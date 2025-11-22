'use client';

import { useState } from 'react';
import { UserX, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationModal } from './delete-confirmation-modal';

interface DeleteAccountButtonProps {
  className?: string;
  onAccountDeleted?: () => void;
  requirePassword?: boolean;
}

export function DeleteAccountButton({
  className,
  onAccountDeleted,
  requirePassword = true
}: DeleteAccountButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (password?: string) => {
    setLoading(true);

    try {
      const response = await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm: true,
          password: requirePassword ? password : undefined,
          // Include user identification from auth context
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }

      const result = await response.json();

      // Account deleted successfully
      setShowModal(false);

      // Notify parent component
      if (onAccountDeleted) {
        onAccountDeleted();
      } else {
        // Default behavior: redirect to logout/goodbye page
        window.location.href = '/goodbye';
      }
    } catch (error) {
      console.error('Delete account failed:', error);
      throw error; // Re-throw to be handled by the modal
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="destructive"
        className={className}
      >
        <UserX className="h-4 w-4 mr-2" />
        Delete My Account
      </Button>

      <DeleteConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        loading={loading}
        requirePassword={requirePassword}
      />
    </>
  );
}