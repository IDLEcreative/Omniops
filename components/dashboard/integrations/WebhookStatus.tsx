"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";

interface WebhookStatusProps {
  domain: string;
  platform: 'woocommerce' | 'shopify';
  onRefresh?: () => void;
}

interface WebhookStatusData {
  success: boolean;
  exists: boolean;
  active: boolean;
  webhookId?: number;
  deliveryUrl?: string;
  error?: string;
}

export function WebhookStatus({ domain, platform, onRefresh }: WebhookStatusProps) {
  const [status, setStatus] = useState<WebhookStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/webhooks/setup?domain=${domain}&platform=${platform}`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch webhook status:', error);
      setStatus({
        success: false,
        exists: false,
        active: false,
        error: 'Failed to check webhook status'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const response = await fetch('/api/webhooks/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          platform,
          action: 'register'
        })
      });

      const result = await response.json();

      if (result.success) {
        await fetchStatus();
        if (onRefresh) onRefresh();
      } else {
        setStatus({
          success: false,
          exists: false,
          active: false,
          error: result.error || 'Failed to register webhook'
        });
      }
    } catch (error) {
      console.error('Failed to retry webhook registration:', error);
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [domain, platform]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            Purchase Tracking Status
          </CardTitle>
          <CardDescription>
            Checking webhook configuration...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isActive = status?.exists && status?.active;
  const hasError = status && !status.success;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isActive ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <CardTitle>Purchase Tracking Status</CardTitle>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Not Configured"}
          </Badge>
        </div>
        <CardDescription>
          {isActive
            ? `Automatically tracking orders from ${platform === 'woocommerce' ? 'WooCommerce' : 'Shopify'}`
            : `Webhook not configured - purchase tracking disabled`
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Webhook ID:</span>
            <span className="font-mono">{status?.webhookId || 'N/A'}</span>
          </div>
          {status?.deliveryUrl && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Endpoint:</span>
              <span className="font-mono text-xs truncate max-w-[200px]">
                {status.deliveryUrl}
              </span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {hasError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Issue:</strong> {status.error}
            </p>
          </div>
        )}

        {/* Retry Button */}
        {!isActive && (
          <Button
            onClick={handleRetry}
            disabled={retrying}
            variant="outline"
            className="w-full"
          >
            {retrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Registering Webhook...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Enable Purchase Tracking
              </>
            )}
          </Button>
        )}

        {/* Active Status Info */}
        {isActive && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">
              ✓ Purchase tracking is enabled. All orders from your {platform === 'woocommerce' ? 'WooCommerce store' : 'Shopify store'} will automatically be attributed to chat conversations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
