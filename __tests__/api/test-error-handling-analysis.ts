/**
 * Static Error Handling Analysis
 *
 * Analyzes the codebase to identify error handling patterns,
 * edge cases, and potential improvements.
 */

import { APIErrorAnalyzer } from './error-analysis/api-error-analyzer';
import { FrontendErrorAnalyzer } from './error-analysis/frontend-error-analyzer';
import { MessageQualityAnalyzer } from './error-analysis/message-quality-analyzer';
import { ReportGenerator } from './error-analysis/report-generator';
import { Finding } from './error-analysis/types';

class ErrorHandlingAnalyzer {
  private findings: Finding[] = [];

  async analyzeErrorHandling(): Promise<void> {
    console.log('\n========== ERROR HANDLING ANALYSIS ==========\n');

    // 1. Analyze API error handling
    console.log('Analyzing error handling in API routes...');
    const apiAnalyzer = new APIErrorAnalyzer();
    this.findings.push(...apiAnalyzer.analyze());

    // 2. Analyze frontend error handling
    console.log('Analyzing frontend component error handling...');
    const frontendAnalyzer = new FrontendErrorAnalyzer();
    this.findings.push(...frontendAnalyzer.analyze());

    // 3. Analyze error messages
    console.log('Analyzing error messages for quality and clarity...');
    const messageAnalyzer = new MessageQualityAnalyzer();
    this.findings.push(...messageAnalyzer.analyze());

    // 4. Generate report
    const reporter = new ReportGenerator();
    reporter.generateReport(this.findings);
  }
}

// Run analysis
async function main() {
  const analyzer = new ErrorHandlingAnalyzer();
  await analyzer.analyzeErrorHandling();
}

main().catch(console.error);
