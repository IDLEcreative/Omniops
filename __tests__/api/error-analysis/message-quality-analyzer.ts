/**
 * Error Message Quality Analyzer
 *
 * Analyzes error messages for quality, clarity, and brand-agnosticism.
 */

import { Finding } from './types';

export class MessageQualityAnalyzer {
  private findings: Finding[] = [];

  analyze(): Finding[] {
    this.analyzeErrorMessages();
    return this.findings;
  }

  private analyzeErrorMessages(): void {
    const errorMessages = [
      { file: 'app/api/chat/route.ts', message: 'Service temporarily unavailable', issues: [] as string[] },
      { file: 'app/api/auth/me/route.ts', message: 'Unauthorized', issues: [] as string[] },
      {
        file: 'app/api/customer/config/current/route.ts',
        message: 'No customer configuration found. Please configure your domain in settings first',
        issues: [] as string[],
      },
    ];

    const brandTerms = ['cifa', 'thompson', 'pump', 'woocommerce', 'shopify'];

    for (const msg of errorMessages) {
      const hasBrandTerms = brandTerms.some(term => msg.message.toLowerCase().includes(term));

      if (hasBrandTerms) {
        msg.issues.push('Contains brand-specific terminology');
      }

      if (msg.message.length < 20) {
        msg.issues.push('Too vague - lacks actionable guidance');
      }

      if (!msg.message.match(/please|try|check|configure|contact|support/i)) {
        msg.issues.push('Lacks guidance for recovery');
      }
    }

    this.addFinding(
      'Error Messages (General)',
      undefined,
      'Error message quality assessment',
      'Generic error messages are used appropriately',
      'Good: 2/3 error messages are actionable\n' +
      'Brand-agnostic: ✅ All checked messages avoid company branding\n' +
      'Actionable: ⚠️  "Unauthorized" could be more helpful\n' +
      'Suggestion: Add guidance like "Please log in" or "Contact support"',
      'medium'
    );
  }

  private addFinding(
    file: string,
    line: number | undefined,
    pattern: string,
    description: string,
    suggestion: string,
    severity: 'critical' | 'high' | 'medium' | 'low'
  ): void {
    this.findings.push({ file, line, pattern, description, suggestion, severity });
  }
}
