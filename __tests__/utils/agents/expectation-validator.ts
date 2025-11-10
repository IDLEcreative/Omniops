/**
 * Validates message responses against test expectations
 * Handles text matching, context checking, and history references
 */

import type { MessageExpectations, ExpectationResult } from './conversation-types';

const HISTORICAL_PHRASES = [
  'as mentioned',
  'you asked',
  'earlier',
  'previously',
  'before',
  'you said',
  'we discussed',
  'referring to',
  'about the',
  'regarding',
];

export class ExpectationValidator {
  static validate(
    response: string,
    expectations: MessageExpectations,
    messageHistory: Array<{ input: string; response: string }>
  ): ExpectationResult {
    const failures: string[] = [];
    const lowerResponse = response.toLowerCase();

    // Check shouldContain expectations
    if (expectations.shouldContain) {
      for (const term of expectations.shouldContain) {
        if (!lowerResponse.includes(term.toLowerCase())) {
          failures.push(`Should contain "${term}"`);
        }
      }
    }

    // Check shouldNotContain expectations
    if (expectations.shouldNotContain) {
      for (const term of expectations.shouldNotContain) {
        if (lowerResponse.includes(term.toLowerCase())) {
          failures.push(`Should NOT contain "${term}"`);
        }
      }
    }

    // Check historical reference if needed
    if (expectations.shouldReferenceHistory && messageHistory.length > 1) {
      if (!this.hasHistoricalReference(response)) {
        failures.push('Should reference previous conversation');
      }
    }

    // Check context maintenance
    if (expectations.shouldMaintainContext && expectations.contextKeywords) {
      const maintainsContext = expectations.contextKeywords.some(keyword =>
        lowerResponse.includes(keyword.toLowerCase())
      );
      if (!maintainsContext) {
        failures.push(
          `Should maintain context with keywords: ${expectations.contextKeywords.join(', ')}`
        );
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  private static hasHistoricalReference(response: string): boolean {
    const lowerResponse = response.toLowerCase();
    return HISTORICAL_PHRASES.some(phrase => lowerResponse.includes(phrase));
  }
}
