/**
 * AI optimization utilities for scraper
 * Extracted from scraper-api-handlers.ts
 */

import { ExtractedContent } from '../content-extractor';
import { EcommerceExtractedContent } from '../ecommerce-extractor';
import { AIContentExtractor, DeduplicationService } from '../scraper-api-ai';
import { AIOptimizationMonitor } from '../crawler-config';
import { AIOptimizationConfig } from '../scraper-api-types';

// Get AI optimization monitor instance
const aiOptimizationMonitor = AIOptimizationMonitor.getInstance();

/**
 * Apply AI optimization to extracted content
 */
export async function applyAIOptimization(
  extracted: ExtractedContent | EcommerceExtractedContent,
  url: string,
  aiOptimization: AIOptimizationConfig
): Promise<any> {
  const optimizationStartTime = Date.now();
  let wasError = false;
  const wasCacheHit = false;
  let wasDeduplicated = false;
  let originalTokens = 0;
  let optimizedTokens = 0;

  try {
    console.log(`[AI] Applying ${aiOptimization.level} optimization to ${url}`);

    // Run AI content optimization
    const aiResult = await AIContentExtractor.optimizeContent(
      extracted.content,
      aiOptimization
    );

    originalTokens = aiResult.metrics.originalTokens;
    optimizedTokens = aiResult.metrics.optimizedTokens;

    // Run deduplication if enabled
    let deduplicationResult = null;
    if (aiOptimization.deduplicationEnabled) {
      deduplicationResult = await DeduplicationService.analyzeContent(
        extracted.content,
        url
      );
      wasDeduplicated = deduplicationResult.isDuplicate;
    }

    const aiOptimizedData = {
      aiOptimized: true,
      optimization: {
        originalTokens: aiResult.metrics.originalTokens,
        optimizedTokens: aiResult.metrics.optimizedTokens,
        reductionPercent: Math.round(
          ((aiResult.metrics.originalTokens - aiResult.metrics.optimizedTokens) /
           aiResult.metrics.originalTokens) * 100
        ),
        compressionRatio: aiResult.metrics.originalTokens / aiResult.metrics.optimizedTokens
      },
      semanticChunks: aiResult.semanticChunks,
      aiMetadata: aiResult.metadata,
      deduplication: deduplicationResult ? {
        uniqueContentId: deduplicationResult.uniqueContentId,
        commonElementRefs: deduplicationResult.commonElementRefs
      } : undefined
    };

    // Use optimized content if it meets quality thresholds
    if (aiResult.optimizedContent.length > 100) {
      extracted.content = aiResult.optimizedContent;
    }

    console.log(`[AI] Optimization complete: ${aiOptimizedData.optimization.reductionPercent}% reduction`);

    return aiOptimizedData;

  } catch (error) {
    console.error(`[AI] Optimization failed for ${url}:`, error);
    wasError = true;

    // Continue with regular extraction as fallback
    return {
      aiOptimized: false,
      optimization: {
        originalTokens: 0,
        optimizedTokens: 0,
        reductionPercent: 0,
        compressionRatio: 1
      }
    };
  } finally {
    // Record performance metrics
    const processingTime = Date.now() - optimizationStartTime;
    aiOptimizationMonitor.recordOptimization({
      processingTimeMs: processingTime,
      originalTokens,
      optimizedTokens,
      wasError,
      wasCacheHit,
      wasDeduplicated
    });
  }
}
