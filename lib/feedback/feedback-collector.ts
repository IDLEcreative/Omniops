/**
 * User Feedback Collection System
 *
 * Provides in-widget feedback mechanisms:
 * - Quick satisfaction ratings (thumbs up/down)
 * - Detailed feedback forms
 * - Bug reporting
 * - Feature requests
 * - NPS score collection
 *
 * Used by: Widget embed, dashboard, analytics
 *
 * NOTE: This file now re-exports from modular structure in collector/
 * See lib/feedback/collector/ for implementation details
 */

// Re-export all public APIs from modular structure
export {
  // Types and enums
  FeedbackType,
  SatisfactionRating,
  FeedbackSchema,
  type FeedbackData,

  // Core classes
  FeedbackCollector,
  FeedbackAnalyzer,

  // Widget
  createFeedbackWidget,
} from './collector';
