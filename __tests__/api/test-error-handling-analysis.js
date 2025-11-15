/**
 * Static Error Handling Analysis
 * Analyzes the codebase for error handling patterns and edge cases
 *
 * This file serves as the main entry point for error handling analysis.
 * Individual analyzers are split into:
 * - analyzers/api-error-analyzer.js (API route error handling)
 * - analyzers/frontend-error-analyzer.js (React component error handling, edge cases, timeouts)
 * - analyzers/error-message-analyzer.js (error message quality)
 * - analyzers/report-generator.js (summary and recommendations)
 */

const { ErrorFindingTracker } = require('./helpers/error-analysis-helpers');
const { analyzeAPIErrorHandling } = require('./analyzers/api-error-analyzer');
const {
  analyzeFrontendErrorHandling,
  analyzeEdgeCaseHandling,
  analyzeTimeoutPatterns
} = require('./analyzers/frontend-error-analyzer');
const { analyzeErrorMessages } = require('./analyzers/error-message-analyzer');
const { generateReport } = require('./analyzers/report-generator');

class ErrorHandlingAnalyzer {
  constructor() {
    this.tracker = new ErrorFindingTracker();
  }

  analyzeErrorHandling() {
    console.log('\n========== ERROR HANDLING ANALYSIS ==========\n');

    analyzeAPIErrorHandling(this.tracker);
    analyzeErrorMessages(this.tracker);
    analyzeFrontendErrorHandling(this.tracker);
    analyzeEdgeCaseHandling(this.tracker);
    analyzeTimeoutPatterns(this.tracker);

    generateReport(this.tracker);
  }
}

// Run analysis
const analyzer = new ErrorHandlingAnalyzer();
analyzer.analyzeErrorHandling();
