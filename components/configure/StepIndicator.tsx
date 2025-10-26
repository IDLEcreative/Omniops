/**
 * Progress indicator for configuration wizard
 */

import { Badge } from '@/components/ui/badge';

interface StepIndicatorProps {
  currentStep: 'appearance' | 'features' | 'behavior';
}

const steps = [
  { key: 'appearance', label: 'Appearance' },
  { key: 'features', label: 'Features' },
  { key: 'behavior', label: 'Behavior' },
] as const;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => {
        const isActive = step.key === currentStep;
        const isPast = steps.findIndex(s => s.key === currentStep) > index;

        return (
          <div key={step.key} className="flex items-center">
            <Badge
              variant={isActive ? 'default' : isPast ? 'secondary' : 'outline'}
              className="px-3 py-1"
            >
              {step.label}
            </Badge>
            {index < steps.length - 1 && (
              <div className="w-8 h-px bg-border mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}
