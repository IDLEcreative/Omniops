"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Radio, Circle } from 'lucide-react';

interface LiveStatusIndicatorProps {
  isLive: boolean;
  onToggle: () => void;
  lastFetchTime: number;
  newCount: number;
  onAcknowledge: () => void;
}

export function LiveStatusIndicator({
  isLive,
  onToggle,
  lastFetchTime,
  newCount,
  onAcknowledge
}: LiveStatusIndicatorProps) {
  const timeSinceLastFetch = Math.floor((Date.now() - lastFetchTime) / 1000);

  return (
    <div className="flex items-center gap-2">
      {newCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAcknowledge}
          className="animate-pulse border-green-500 text-green-600 hover:bg-green-50"
          aria-label={`Load ${newCount} new conversation${newCount !== 1 ? 's' : ''}`}
        >
          {newCount} new conversation{newCount !== 1 ? 's' : ''}
        </Button>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={onToggle}
              className="gap-2"
              aria-label={isLive ? "Disable live updates" : "Enable live updates"}
            >
              {isLive ? (
                <>
                  <Radio className="h-3 w-3 animate-pulse" />
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-0">
                    Live
                  </Badge>
                </>
              ) : (
                <>
                  <Circle className="h-3 w-3" />
                  <span className="text-xs">Paused</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isLive
              ? `Auto-refreshing every 30s (last update ${timeSinceLastFetch}s ago)`
              : 'Click to enable auto-refresh'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
