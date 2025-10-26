/**
 * Type definitions for conversation competency testing
 */

export const BASELINE_SCORES = {
  correctionAccuracy: 33,
  listReferenceAccuracy: 33,
  pronounAccuracy: 50,
  overallAccuracy: 71.4
};

export const TARGET_SCORES = {
  correctionAccuracy: 90,
  listReferenceAccuracy: 85,
  pronounAccuracy: 85,
  overallAccuracy: 90
};

export interface TestCase {
  name: string;
  category: 'correction' | 'list_reference' | 'pronoun';
  setup: () => Promise<void>;
  execute: () => Promise<boolean>;
}

export interface CompetencyReport {
  correctionAccuracy: number;
  listReferenceAccuracy: number;
  pronounAccuracy: number;
  overallAccuracy: number;

  baseline: typeof BASELINE_SCORES;
  target: typeof TARGET_SCORES;

  improvement: {
    correctionAccuracy: number;
    listReferenceAccuracy: number;
    pronounAccuracy: number;
    overallAccuracy: number;
  };

  details: {
    total: number;
    passed: number;
    failed: number;
    byCategory: {
      correction: { passed: number; total: number };
      list_reference: { passed: number; total: number };
      pronoun: { passed: number; total: number };
    };
  };
}
