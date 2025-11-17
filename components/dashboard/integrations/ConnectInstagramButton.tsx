'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Loader2 } from 'lucide-react';

interface ConnectInstagramButtonProps {
  customerId: string;
  onError?: (error: string) => void;
}

/**
 * Connect Instagram Button Component
 * Initiates OAuth flow for Instagram Business account connection
 */
export function ConnectInstagramButton({
  customerId,
  onError,
}: ConnectInstagramButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // Generate OAuth URL
      const response = await fetch('/api/instagram/auth/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate OAuth URL');
      }

      const { authUrl } = await response.json();

      // Redirect to Meta OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Instagram connection:', error);
      setIsConnecting(false);
      onError?.(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2"
      size="lg"
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Instagram className="w-5 h-5" />
          Connect Instagram
        </>
      )}
    </Button>
  );
}
