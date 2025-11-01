/**
 * AI Metadata Generator - Strategies
 * Main composition and exports
 */

// Re-export all functions
export {
  tokenize,
  splitIntoSentences,
  getWordCounts,
  calculateTFIDF,
  extractTopicsFromTFIDF,
  extractTopics,
  extractKeywords
} from './text-processing';

export {
  extractEntities
} from './entity-extraction';

export {
  generateExtractiveSummary,
  generateFallbackBriefSummary
} from './summary-generation';

export {
  classifyContentType,
  analyzeSentiment,
  assessComplexity,
  generateIntentMappings,
  extractFAQQuestions
} from './content-analysis';
