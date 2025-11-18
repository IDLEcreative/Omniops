"use client";

/**
 * Product Recommendations Component
 *
 * Displays AI-powered product recommendations in the chat widget
 */

import { useState } from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ProductRecommendationsProps {
  sessionId?: string;
  conversationId?: string;
  domainId: string;
  context?: string;
  limit?: number;
  onProductClick?: (productId: string) => void;
}

export function ProductRecommendations({
  sessionId,
  conversationId,
  domainId,
  context,
  limit = 5,
  onProductClick,
}: ProductRecommendationsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { recommendations, loading, error, trackClick } = useRecommendations({
    sessionId,
    conversationId,
    domainId,
    context,
    limit,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" aria-label="Loading recommendations" />
      </div>
    );
  }

  if (error || !recommendations.length) {
    return null;
  }

  const handleProductClick = async (productId: string) => {
    await trackClick(productId);
    onProductClick?.(productId);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? recommendations.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === recommendations.length - 1 ? 0 : prev + 1
    );
  };

  const currentRec = recommendations[currentIndex];

  // Guard against undefined currentRec
  if (!currentRec) {
    return null;
  }

  return (
    <div className="my-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Recommended for you</span>
        <Badge variant="secondary" className="text-xs">
          {currentRec.algorithm}
        </Badge>
      </div>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Product Info */}
          <div className="flex-1">
            <h4 className="font-medium mb-1">{currentRec.productId}</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {currentRec.reason}
            </p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleProductClick(currentRec.productId)}
              >
                View Product
              </Button>

              {/* Why this recommendation tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-medium mb-1">Why recommended?</p>
                      <p>{currentRec.reason}</p>
                      <p className="mt-1 text-muted-foreground">
                        Score: {(currentRec.score * 100).toFixed(0)}%
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Navigation */}
          {recommendations.length > 1 && (
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePrevious}
                className="h-8 w-8"
                aria-label="Previous recommendation"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {recommendations.length}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleNext}
                className="h-8 w-8"
                aria-label="Next recommendation"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
