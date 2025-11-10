/**
 * Phase Card Component
 *
 * Displays feature flags grouped by rollout phase (1, 2, or 3).
 * Each phase has a different stability level and description.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeatureRow, type FeatureStatus } from './FeatureRow';

interface PhaseCardProps {
  phase: 1 | 2 | 3;
  features: FeatureStatus[];
  onToggle: (featureName: string, enabled: boolean) => Promise<void>;
  onAdvanceRollout?: (featureName: string) => Promise<void>;
  onRollback?: (featureName: string) => Promise<void>;
  disabled?: boolean;
}

const PHASE_CONFIG = {
  1: {
    title: 'Phase 1: Parent Storage',
    badge: { text: 'Stable', className: 'bg-green-500' },
    description: 'Production-ready features enabled by default for all customers.',
  },
  2: {
    title: 'Phase 2: Enhanced Reliability',
    badge: { text: 'Beta', className: 'bg-blue-500' },
    description: 'Advanced features available for beta testing. Opt-in required.',
  },
  3: {
    title: 'Phase 3: Advanced Features',
    badge: { text: 'Experimental', className: 'bg-purple-500' },
    description: 'Cutting-edge features under active development. Use with caution.',
  },
};

export function PhaseCard({
  phase,
  features,
  onToggle,
  onAdvanceRollout,
  onRollback,
  disabled,
}: PhaseCardProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {config.title}
          <Badge variant="default" className={config.badge.className}>
            {config.badge.text}
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-500">{config.description}</p>
      </CardHeader>
      <CardContent>
        {features.map(feature => (
          <FeatureRow
            key={feature.name}
            feature={feature}
            onToggle={onToggle}
            onAdvanceRollout={onAdvanceRollout}
            onRollback={onRollback}
            disabled={disabled}
          />
        ))}
      </CardContent>
    </Card>
  );
}
