/**
 * Clarification and Correction Test Scenario
 * Tests if agent handles clarifications and corrections properly
 */

import type { TestScenario } from '../../utils/agents';

export const clarificationAndCorrection: TestScenario = {
  name: 'Clarification and Correction',
  description: 'Test if agent handles clarifications and corrections properly',
  messages: [
    {
      input: 'I need parts for my ZF5 pump',
      expectations: {
        shouldContain: ['zf5', 'pump', 'parts'],
      },
    },
    {
      input: 'Sorry, I meant ZF4 not ZF5',
      expectations: {
        shouldContain: ['zf4'],
        shouldReferenceHistory: true,
        shouldMaintainContext: true,
        contextKeywords: ['pump', 'parts'],
      },
    },
    {
      input: 'What\'s the difference between them?',
      expectations: {
        shouldContain: ['zf4', 'zf5'],
        shouldReferenceHistory: true,
        shouldMaintainContext: true,
        contextKeywords: ['difference', 'pump'],
      },
    },
  ],
};
