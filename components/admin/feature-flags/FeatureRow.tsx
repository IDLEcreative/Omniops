/**
 * Feature Row Component
 *
 * Individual feature flag row with:
 * - Toggle switch for enable/disable
 * - Rollout controls (advance/rollback)
 * - Status display and statistics
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export interface FeatureStatus {
  name: string;
  displayName: string;
  description: string;
  enabled: boolean;
  phase: 1 | 2 | 3;
  rollout?: {
    percentage: number;
  };
  stats?: {
    enabledCustomers: number;
    totalCustomers: number;
    errorCount: number;
    successRate: number;
    errorRate: number;
  };
}

interface FeatureRowProps {
  feature: FeatureStatus;
  onToggle: (featureName: string, enabled: boolean) => Promise<void>;
  onAdvanceRollout?: (featureName: string) => Promise<void>;
  onRollback?: (featureName: string) => Promise<void>;
  disabled?: boolean;
}

export function FeatureRow({
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
