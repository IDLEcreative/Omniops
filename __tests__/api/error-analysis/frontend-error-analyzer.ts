/**
 * Frontend Error Handling Analyzer
 *
 * Analyzes error handling patterns in frontend components.
 */

import { Finding } from './types';

export class FrontendErrorAnalyzer {
  private findings: Finding[] = [];

  analyze(): Finding[] {
    this.analyzeFrontendErrorHandling();
    this.analyzeEdgeCases();
    this.analyzeTimeoutPatterns();
    return this.findings;
  }

  private analyzeFrontendErrorHandling(): void {
    this.addFinding(
      'components/ChatWidget.tsx',
      67,
      'Frontend error handling in sendMessage',
      'Chat widget has try-catch but limited error feedback',
      'Current implementation:\n' +
      '✅ Try-catch block for API errors\n' +
      '✅ Tracks loading state\n' +
      '⚠️  Error details not shown to user\n' +
      '⚠️  No retry mechanism\n' +
      '⚠️  No timeout handling\n' +
      'Suggestion: Show user-friendly error messages with retry option',
      'high'
    );

    this.addFinding(
      'app/dashboard/settings/page.tsx',
      33,
      'Settings error handling',
      'Settings page loads and saves with basic error handling',
      'Current:\n' +
      '✅ Try-catch on save\n' +
      '✅ Loading state\n' +
      '✅ Success/error status feedback\n' +
      '⚠️  Error messages not shown to user (console only)\n' +
      'Improvement: Display error toast/alert to user',
      'medium'
    );

    this.addFinding(
      'components/ChatWidget/hooks/useChatState.ts',
      130,
      'Config loading without error handling',
      'WooCommerce config check lacks error feedback',
      'Issue: Silent failure on fetch error\n' +
      "Impact: User won't know WooCommerce is unavailable\n" +
      'Fix: Add error handling and user feedback',
      'high'
    );
  }

  private analyzeEdgeCases(): void {
    this.addFinding(
      'app/embed/page.tsx',
      33,
      'URL parameter parsing',
      'Parses URL parameters without sanitization',
      'Current:\n' +
      '✅ Uses URLSearchParams (safe parsing)\n' +
      '⚠️  localStorage.getItem used without try-catch\n' +
      '⚠️  JSON.parse of localStorage data could fail\n' +
      'Fix: Wrap localStorage access in try-catch',
      'medium'
    );

    this.addFinding(
      'app/embed/page.tsx',
      64,
      'localStorage.getItem without error handling',
      'JSON.parse of localStorage data could fail',
      'Current: Unsafe JSON.parse in line 43\n' +
      'Risk: Corrupted localStorage crashes component\n' +
      'Fix: Wrap in try-catch with fallback',
      'high'
    );
  }

  private analyzeTimeoutPatterns(): void {
    this.addFinding(
      'app/api/chat/route.ts',
      175,
      'No timeout on AI processing',
      'processAIConversation lacks timeout mechanism',
      'Concern: OpenAI API calls could hang indefinitely\n' +
      'Current: Relies on Next.js function timeout (~60s)\n' +
      'Recommendation: Add explicit timeout with user feedback',
      'high'
    );

    this.addFinding(
      'components/ChatWidget/hooks/useChatState.ts',
      145,
      'No timeout on fetch requests',
      'Fetch to /api/customer/config lacks timeout',
      'Current: Infinite wait if API hangs\n' +
      'Fix: Add AbortController with timeout\n' +
      'Target: 5 second timeout with fallback',
      'high'
    );
  }

  private addFinding(
    file: string,
    line: number,
    pattern: string,
    description: string,
    suggestion: string,
    severity: 'critical' | 'high' | 'medium' | 'low'
  ): void {
    this.findings.push({ file, line, pattern, description, suggestion, severity });
  }
}
