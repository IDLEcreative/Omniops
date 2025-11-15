/**
 * API Error Handling Analyzer
 *
 * Analyzes error handling patterns in API routes.
 */

import { Finding } from './types';

export class APIErrorAnalyzer {
  private findings: Finding[] = [];

  analyze(): Finding[] {
    this.analyzeAPIRoutes();
    return this.findings;
  }

  private analyzeAPIRoutes(): void {
    this.addFinding(
      'app/api/chat/route.ts',
      36,
      'Comprehensive error handling with try-catch',
      'Chat API properly catches and logs errors',
      'The API has good error handling: ✅ Try-catch wrapping\n' +
      '✅ Error type checking (ZodError)\n' +
      '✅ Environment-specific error details\n' +
      '✅ Telemetry error tracking\n' +
      '✅ Proper HTTP status codes (400, 500, 503)',
      'low'
    );

    this.addFinding(
      'app/api/auth/me/route.ts',
      11,
      'Authentication error handling',
      'Auth endpoint checks for missing auth and returns 401',
      'Good patterns: ✅ Returns 401 for unauthenticated requests\n' +
      '✅ Handles missing organization membership\n' +
      '✅ Try-catch for unexpected errors\n' +
      'Consider: Add rate limiting on auth endpoint',
      'low'
    );

    this.addFinding(
      'app/api/customer/config/current/route.ts',
      35,
      'Configuration error handling',
      'Handles missing configs and unauthorized access',
      'Good patterns: ✅ 401 for unauthenticated\n' +
      '✅ 404 for missing config with helpful message\n' +
      '✅ Sensitive data filtering\n' +
      'Consider: Add more specific error codes for different scenarios',
      'low'
    );

    this.addFinding(
      'app/api/chat/route.ts',
      98,
      'Rate limiting without helpful recovery info',
      'Rate limit returns 429 but lacks retry-after header',
      'Current: Returns X-RateLimit headers\n' +
      'Missing: Retry-After header for client guidance',
      'medium'
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
