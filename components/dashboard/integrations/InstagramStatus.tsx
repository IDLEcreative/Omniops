'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Instagram, AlertCircle, Calendar, MessageCircle } from 'lucide-react';
import { ConnectInstagramButton } from './ConnectInstagramButton';

interface InstagramCredentials {
  id: string;
  instagram_username: string;
  instagram_name: string;
  is_active: boolean;
  oauth_completed_at: string;
  last_message_at?: string;
  access_token_expires_at?: string;
}

interface InstagramStatusProps {
  credentials: InstagramCredentials | null;
  customerId: string;
  onDisconnect?: () => void;
  onReconnect?: () => void;
}

/**
 * Instagram Status Display Component
 * Shows connection status and account information
 */
export function InstagramStatus({
  credentials,
  customerId,
  onDisconnect,
  onReconnect,
}: InstagramStatusProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if token is expiring soon (within 7 days)
  const isTokenExpiringSoon = () => {
    if (!credentials?.access_token_expires_at) return false;
    const expiryDate = new Date(credentials.access_token_expires_at);
    const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 7 && daysUntilExpiry > 0;
  };

  // Check if token is expired
  const isTokenExpired = () => {
    if (!credentials?.access_token_expires_at) return false;
    return new Date(credentials.access_token_expires_at) < new Date();
  };

  const handleDisconnect = async () => {
    if (!credentials) return;

    if (!confirm('Are you sure you want to disconnect Instagram? You will no longer receive or respond to Instagram DMs.')) {
      return;
    }

    try {
      setIsDisconnecting(true);
      setError(null);

      const response = await fetch(`/api/instagram/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Instagram');
      }

      onDisconnect?.();
    } catch (error) {
      console.error('Failed to disconnect Instagram:', error);
      setError(error instanceof Error ? error.message : 'Disconnect failed');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Not connected - show connection prompt
  if (!credentials) {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Instagram Messenger</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Connect your Instagram Business account to automatically respond to DMs with AI-powered assistance.
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                60-second setup (OAuth)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Automatic DM responses
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                24/7 customer support
              </li>
            </ul>
            <ConnectInstagramButton
              customerId={customerId}
              onError={setError}
            />
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Connected - show status
  const tokenExpiringSoon = isTokenExpiringSoon();
  const tokenExpired = isTokenExpired();

  return (
    <div className={`border rounded-lg p-6 ${
      tokenExpired ? 'bg-red-50 border-red-200' :
      tokenExpiringSoon ? 'bg-yellow-50 border-yellow-200' :
      'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              {tokenExpired ? (
                <>
                  <AlertCircle className="text-red-600 w-5 h-5" />
                  Instagram Disconnected (Token Expired)
                </>
              ) : tokenExpiringSoon ? (
                <>
                  <AlertCircle className="text-yellow-600 w-5 h-5" />
                  Instagram Connected (Token Expiring Soon)
                </>
              ) : (
                <>
                  <CheckCircle className="text-green-600 w-5 h-5" />
                  Instagram Connected
                </>
              )}
            </h3>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Instagram className="w-4 h-4 text-gray-500" />
                <span className="font-medium">@{credentials.instagram_username}</span>
                {credentials.instagram_name && (
                  <span className="text-gray-500">({credentials.instagram_name})</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                Connected: {formatDate(credentials.oauth_completed_at)}
              </div>

              {credentials.last_message_at && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageCircle className="w-4 h-4" />
                  Last message: {formatDate(credentials.last_message_at)}
                </div>
              )}

              {credentials.access_token_expires_at && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4" />
                  Token expires: {formatDate(credentials.access_token_expires_at)}
                </div>
              )}
            </div>

            {tokenExpired && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                <p className="text-sm text-red-700 font-medium">
                  Your Instagram connection has expired. Reconnect to continue receiving DMs.
                </p>
              </div>
            )}

            {tokenExpiringSoon && !tokenExpired && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                <p className="text-sm text-yellow-700">
                  Your Instagram token will expire soon. Consider reconnecting to avoid interruption.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {tokenExpired ? (
                <ConnectInstagramButton
                  customerId={customerId}
                  onError={setError}
                />
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                  {tokenExpiringSoon && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onReconnect}
                    >
                      Refresh Token
                    </Button>
                  )}
                </>
              )}
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
