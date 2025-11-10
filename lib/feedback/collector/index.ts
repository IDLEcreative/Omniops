/**
 * Feedback Collection System
 *
 * Provides in-widget feedback mechanisms:
 * - Quick satisfaction ratings (thumbs up/down)
 * - Detailed feedback forms
 * - Bug reporting
 * - Feature requests
 * - NPS score collection
 *
 * Used by: Widget embed, dashboard, analytics
 */

// Re-export types and enums
export {
  FeedbackType,
  SatisfactionRating,
  FeedbackSchema,
  type FeedbackData,
} from './types';

// Re-export collector
export { FeedbackCollector } from './collector';

// Re-export analyzer
export { FeedbackAnalyzer } from './analyzer';

// Re-export widget (browser-only)
export { createFeedbackWidget } from './widget';
