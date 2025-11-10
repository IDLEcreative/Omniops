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

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FeatureStatus } from './feature-flags/FeatureRow';
import { PhaseCard } from './feature-flags/PhaseCard';
import { RolloutStatisticsCard } from './feature-flags/RolloutStatisticsCard';

interface FeatureFlagManagerProps {
  organizationId?: string;
  customerId?: string;
}

export function FeatureFlagManager({ organizationId, customerId }: FeatureFlagManagerProps) {
  const [features, setFeatures] = useState<FeatureStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadFeatures = useCallback(async () => {
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
  }, [organizationId, customerId]);

  const toggleFeature = useCallback(async (featureName: string, enabled: boolean) => {
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
  }, [organizationId, customerId, loadFeatures]);

  const advanceRollout = useCallback(async (featureName: string) => {
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
  }, [loadFeatures]);

  const rollbackFeature = useCallback(async (featureName: string) => {
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
  }, [loadFeatures]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

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

      {/* Phase 1, 2, and 3 Features */}
      {([1, 2, 3] as const).map(phase => (
        <PhaseCard
          key={phase}
          phase={phase}
          features={features.filter(f => f.phase === phase)}
          onToggle={toggleFeature}
          onAdvanceRollout={advanceRollout}
          onRollback={rollbackFeature}
          disabled={saving}
        />
      ))}

      {/* Statistics Summary */}
      <RolloutStatisticsCard features={features} />
    </div>
  );
}
