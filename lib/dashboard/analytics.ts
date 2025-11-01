/**
 * Dashboard analytics - proxy file for backward compatibility
 *
 * This file re-exports all functions from the modular analytics directory
 */

export {
  analyseMessages,
  classifySentiment,
  calculateDailySentiment,
  detectLanguage,
  clamp,
  normaliseContent,
  containsPhrase,
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
  FAILED_SEARCH_PHRASES,
  LANGUAGE_KEYWORDS,
} from './analytics/index';

export type {
  DashboardMessageRecord,
  TopQueryStat,
  LanguageDistributionStat,
  DailySentimentStat,
  MessageAnalytics,
  SupabaseResponse,
} from './analytics/index';
