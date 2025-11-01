/**
 * Dashboard analytics module
 *
 * Provides comprehensive message analytics and sentiment analysis
 */

// Main analysis function
export { analyseMessages } from './message-analyzer';

// Utility functions
export { classifySentiment, calculateDailySentiment } from './sentiment';
export { detectLanguage, clamp, normaliseContent, containsPhrase } from './utilities';

// Constants
export { POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS, FAILED_SEARCH_PHRASES, LANGUAGE_KEYWORDS } from './constants';

// Types
export type {
  DashboardMessageRecord,
  TopQueryStat,
  LanguageDistributionStat,
  DailySentimentStat,
  MessageAnalytics,
  SupabaseResponse,
} from './types';
