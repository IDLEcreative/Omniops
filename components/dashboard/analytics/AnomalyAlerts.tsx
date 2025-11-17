'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, AlertCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';
import type { Anomaly } from '@/lib/analytics/anomaly-detector';

interface AnomalyAlertsProps {
  anomalies: Anomaly[];
}

export function AnomalyAlerts({ anomalies }: AnomalyAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Load dismissed anomalies from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dismissedAnomalies');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedIds(new Set(parsed));
      } catch (e) {
        console.error('[AnomalyAlerts] Failed to parse dismissed anomalies:', e);
      }
    }
  }, []);

  // Filter out dismissed anomalies
  const visibleAnomalies = anomalies.filter((anomaly) => {
    const id = `${anomaly.metric}-${anomaly.detectedAt}`;
    return !dismissedIds.has(id);
  });

  const handleDismiss = (anomaly: Anomaly) => {
    const id = `${anomaly.metric}-${anomaly.detectedAt}`;
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);

    // Persist to localStorage
    localStorage.setItem('dismissedAnomalies', JSON.stringify(Array.from(newDismissed)));
  };

  // Clear old dismissed IDs (older than 24 hours)
  useEffect(() => {
    const cleanup = () => {
      const now = new Date();
      const stored = localStorage.getItem('dismissedAnomalies');
      if (!stored) return;

      try {
        const parsed: string[] = JSON.parse(stored);
        const filtered = parsed.filter((id) => {
          const [, timestamp] = id.split('-');
          if (!timestamp) return false;
          const dismissedAt = new Date(timestamp);
          const hoursSince = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60);
          return hoursSince < 24;
        });

        if (filtered.length < parsed.length) {
          localStorage.setItem('dismissedAnomalies', JSON.stringify(filtered));
        }
      } catch (e) {
        console.error('[AnomalyAlerts] Failed to cleanup dismissed anomalies:', e);
      }
    };

    cleanup();
  }, [anomalies]);

  if (visibleAnomalies.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleAnomalies.map((anomaly) => (
        <AnomalyAlert
          key={`${anomaly.metric}-${anomaly.detectedAt}`}
          anomaly={anomaly}
          onDismiss={() => handleDismiss(anomaly)}
        />
      ))}
    </div>
  );
}

interface AnomalyAlertProps {
  anomaly: Anomaly;
  onDismiss: () => void;
}

function AnomalyAlert({ anomaly, onDismiss }: AnomalyAlertProps) {
  const { severity, message, recommendation, currentValue, expectedValue, percentChange } = anomaly;

  // Determine alert variant and icon
  const alertConfig = {
    critical: {
      variant: 'destructive' as const,
      icon: AlertTriangle,
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-500',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      variant: 'default' as const,
      icon: AlertCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
      variant: 'default' as const,
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-500',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  };

  const config = alertConfig[severity];
  const Icon = config.icon;
  const TrendIcon = percentChange > 0 ? TrendingUp : TrendingDown;

  return (
    <Alert
      variant={config.variant}
      className={`relative ${config.bgColor} border-l-4 ${config.borderColor}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${config.iconColor}`} />

        <div className="flex-1 space-y-2">
          <AlertTitle className="flex items-center gap-2 text-base font-semibold">
            {severity === 'critical' ? 'Critical Alert' : severity === 'warning' ? 'Warning' : 'Notice'}
            <TrendIcon className="h-4 w-4" />
          </AlertTitle>

          <AlertDescription className="space-y-2">
            <p className="text-sm font-medium">{message}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Expected: <span className="font-mono">{expectedValue.toFixed(2)}</span>
              </span>
              <span>
                Current: <span className="font-mono">{currentValue.toFixed(2)}</span>
              </span>
              <span className={percentChange > 0 ? 'text-red-600' : 'text-green-600'}>
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
              </span>
            </div>

            {recommendation && (
              <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded text-xs">
                <strong>Recommendation:</strong> {recommendation}
              </div>
            )}
          </AlertDescription>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss alert</span>
        </Button>
      </div>
    </Alert>
  );
}
