/**
 * Numbered List Reference Test Scenario
 * Tests if agent understands references to numbered items
 */

import type { TestScenario } from '../../utils/agents';

export const numberedListReference: TestScenario = {
  name: 'Numbered List Reference',
  description: 'Test if agent understands references to numbered items',
  messages: [
    {
      input: 'Show me all Cifa mixer pumps you have',
      expectations: {
        shouldContain: ['cifa', 'pump'],
      },
    },
    {
      input: 'Tell me more about item 2',
      expectations: {
        shouldReferenceHistory: true,
        shouldMaintainContext: true,
        contextKeywords: ['pump'],
      },
    },
    {
      input: 'Is that one in stock?',
      expectations: {
        shouldMaintainContext: true,
        contextKeywords: ['stock', 'available'],
        shouldReferenceHistory: true,
      },
    },
  ],
};
