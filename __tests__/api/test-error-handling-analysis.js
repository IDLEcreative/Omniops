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

import { ErrorFindingTracker } from './helpers/error-analysis-helpers.js';
import { analyzeAPIErrorHandling } from './analyzers/api-error-analyzer.js';
import {
  analyzeFrontendErrorHandling,
  analyzeEdgeCaseHandling,
  analyzeTimeoutPatterns
} from './analyzers/frontend-error-analyzer.js';
import { analyzeErrorMessages } from './analyzers/error-message-analyzer.js';
import { generateReport } from './analyzers/report-generator.js';

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
