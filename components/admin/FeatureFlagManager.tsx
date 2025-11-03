/**
 * Feature Flag Manager - Admin UI Component
 *
 * Purpose: Dashboard interface for managing feature flags at customer
 * and organization levels with real-time status and rollout controls.
 *
 * Last Updated: 2025-11-03
 * Status: Active
 *
 * Features:
 * - View all feature flags and their status
 * - Enable/disable flags globally or per-customer
 * - Rollout percentage controls
 * - Usage statistics and error tracking
 * - Rollback capabilities
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';
import type { RolloutConfig, RolloutStats } from '@/lib/rollout/pilot-manager';

interface FeatureFlagManagerProps {
  organizationId?: string;
  customerId?: string;
}

interface FeatureStatus {
  name: string;
  displayName: string;
  description: string;
  enabled: boolean;
  phase: 1 | 2 | 3;
  rollout?: RolloutConfig;
  stats?: RolloutStats;
}

export function FeatureFlagManager({ organizationId, customerId }: FeatureFlagManagerProps) {
  const [features, setFeatures] = useState<FeatureStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFeatures();
  }, [organizationId, customerId]);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (organizationId) params.set('organizationId', organizationId);
      if (customerId) params.set('customerId', customerId);

      const response = await fetch(`/api/admin/feature-flags?${params}`);
      const data = await response.json();

      if (data.success) {
        setFeatures(data.features);
      } else {
        setError(data.error || 'Failed to load features');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureName: string, enabled: boolean) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureName,
          enabled,
          organizationId,
          customerId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadFeatures(); // Reload to get updated stats
      } else {
        setError(data.error || 'Failed to update feature');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const advanceRollout = async (featureName: string) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/rollout/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureName }),
      });

      const data = await response.json();
      if (data.success) {
        await loadFeatures();
      } else {
        setError(data.error || 'Failed to advance rollout');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const rollbackFeature = async (featureName: string) => {
    if (!confirm('Are you sure you want to rollback this feature? This will disable it for all customers.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/rollout/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureName,
          reason: 'Manual rollback via admin UI',
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadFeatures();
      } else {
        setError(data.error || 'Failed to rollback feature');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flag Management</CardTitle>
          <p className="text-sm text-gray-500">
            {customerId
              ? 'Managing flags for specific customer'
              : organizationId
              ? 'Managing flags for organization'
              : 'Managing global feature flags'}
          </p>
        </CardHeader>
      </Card>

      {/* Phase 1 Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Phase 1: Parent Storage
            <Badge variant="default" className="bg-green-500">
              Stable
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-500">
            Production-ready features enabled by default for all customers.
          </p>
        </CardHeader>
        <CardContent>
          {features
            .filter(f => f.phase === 1)
            .map(feature => (
              <FeatureRow
                key={feature.name}
                feature={feature}
                onToggle={toggleFeature}
                disabled={saving}
              />
            ))}
        </CardContent>
      </Card>

      {/* Phase 2 Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Phase 2: Enhanced Reliability
            <Badge variant="default" className="bg-blue-500">
              Beta
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-500">
            Advanced features available for beta testing. Opt-in required.
          </p>
        </CardHeader>
        <CardContent>
          {features
            .filter(f => f.phase === 2)
            .map(feature => (
              <FeatureRow
                key={feature.name}
                feature={feature}
                onToggle={toggleFeature}
                onAdvanceRollout={advanceRollout}
                onRollback={rollbackFeature}
                disabled={saving}
              />
            ))}
        </CardContent>
      </Card>

      {/* Phase 3 Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Phase 3: Advanced Features
            <Badge variant="default" className="bg-purple-500">
              Experimental
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-500">
            Cutting-edge features under active development. Use with caution.
          </p>
        </CardHeader>
        <CardContent>
          {features
            .filter(f => f.phase === 3)
            .map(feature => (
              <FeatureRow
                key={feature.name}
                feature={feature}
                onToggle={toggleFeature}
                onAdvanceRollout={advanceRollout}
                onRollback={rollbackFeature}
                disabled={saving}
              />
            ))}
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Rollout Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {features
              .filter(f => f.stats)
              .map(feature => (
                <div key={feature.name} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{feature.displayName}</h4>
                      <p className="text-sm text-gray-500">{feature.description}</p>
                    </div>
                    <Badge
                      variant={feature.stats!.errorRate > 0.05 ? 'destructive' : 'default'}
                    >
                      {(feature.stats!.successRate * 100).toFixed(1)}% Success
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Enabled:</span>
                      <br />
                      <span className="font-semibold">
                        {feature.stats!.enabledCustomers} / {feature.stats!.totalCustomers}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Errors:</span>
                      <br />
                      <span className="font-semibold">{feature.stats!.errorCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Error Rate:</span>
                      <br />
                      <span className="font-semibold">
                        {(feature.stats!.errorRate * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Rollout:</span>
                      <br />
                      <span className="font-semibold">
                        {feature.rollout?.percentage || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FeatureRowProps {
  feature: FeatureStatus;
  onToggle: (featureName: string, enabled: boolean) => Promise<void>;
  onAdvanceRollout?: (featureName: string) => Promise<void>;
  onRollback?: (featureName: string) => Promise<void>;
  disabled?: boolean;
}

function FeatureRow({
  feature,
  onToggle,
  onAdvanceRollout,
  onRollback,
  disabled,
}: FeatureRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{feature.displayName}</h4>
          {feature.rollout && (
            <Badge variant="outline">{feature.rollout.percentage}% rollout</Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">{feature.description}</p>
        {feature.stats && (
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>
              Enabled: {feature.stats.enabledCustomers} / {feature.stats.totalCustomers}
            </span>
            <span>Errors: {feature.stats.errorCount}</span>
            <span>Success: {(feature.stats.successRate * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onAdvanceRollout && feature.rollout && feature.rollout.percentage < 100 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAdvanceRollout(feature.name)}
            disabled={disabled}
          >
            Advance Rollout
          </Button>
        )}
        {onRollback && feature.rollout && feature.enabled && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRollback(feature.name)}
            disabled={disabled}
            className="text-red-500 hover:text-red-600"
          >
            Rollback
          </Button>
        )}
        <Switch
          checked={feature.enabled}
          onCheckedChange={checked => onToggle(feature.name, checked)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
