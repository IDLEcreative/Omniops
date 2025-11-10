/**
 * Time-Based Context Test Scenario
 * Tests if agent understands temporal references
 */

import type { TestScenario } from '../../utils/agents';

export const timeBasedContext: TestScenario = {
  name: 'Time-Based Context',
  description: 'Test if agent understands temporal references',
  messages: [
    {
      input: 'What new products did you get this month?',
      expectations: {
        shouldContain: ['product', 'new'],
      },
    },
    {
      input: 'And last month?',
      expectations: {
        shouldReferenceHistory: true,
        shouldMaintainContext: true,
        contextKeywords: ['product', 'month'],
      },
    },
    {
      input: 'Show me the most popular ones from what you mentioned',
      expectations: {
        shouldReferenceHistory: true,
        shouldContain: ['popular'],
        shouldMaintainContext: true,
        contextKeywords: ['product'],
      },
    },
  ],
};
