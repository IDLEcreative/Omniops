'use client';

import { useMemo } from 'react';
import { ReferenceLine, ReferenceLineProps } from 'recharts';
import type { ChartAnnotation } from '@/types/dashboard';
import { Rocket, AlertTriangle, Package, Calendar, Info } from 'lucide-react';

interface AnnotationMarkerProps {
  annotation: ChartAnnotation;
  dateKey?: string;
  onClick?: (annotation: ChartAnnotation) => void;
}

// Category to icon mapping
const categoryIcons = {
  campaign: '🚀',
  incident: '⚠️',
  release: '📦',
  event: '📅',
  other: 'ℹ️',
};

export function AnnotationMarker({
  annotation,
  dateKey = 'date',
  onClick,
}: AnnotationMarkerProps) {
  // Format the date to match chart data format
  const formattedDate = useMemo(() => {
    return new Date(annotation.annotation_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [annotation.annotation_date]);

  const icon = categoryIcons[annotation.category] || categoryIcons.other;

  const handleClick = () => {
    if (onClick) {
      onClick(annotation);
    }
  };

  return (
    <ReferenceLine
      x={formattedDate}
      stroke={annotation.color}
      strokeDasharray="3 3"
      strokeWidth={2}
      label={{
        value: `${icon} ${annotation.title}`,
        position: 'top',
        fill: annotation.color,
        fontSize: 12,
        fontWeight: 600,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      ifOverflow="extendDomain"
    />
  );
}

interface AnnotationTooltipContentProps {
  annotation: ChartAnnotation;
}

export function AnnotationTooltipContent({ annotation }: AnnotationTooltipContentProps) {
  const Icon = useMemo(() => {
    switch (annotation.category) {
      case 'campaign':
        return Rocket;
      case 'incident':
        return AlertTriangle;
      case 'release':
        return Package;
      case 'event':
        return Calendar;
      default:
        return Info;
    }
  }, [annotation.category]);

  return (
    <div
      className="bg-card border border-border rounded-lg p-3 shadow-lg"
      style={{ borderLeftColor: annotation.color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: annotation.color }} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground mb-1">{annotation.title}</div>
          {annotation.description && (
            <div className="text-xs text-muted-foreground whitespace-pre-wrap">
              {annotation.description}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            {new Date(annotation.annotation_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
