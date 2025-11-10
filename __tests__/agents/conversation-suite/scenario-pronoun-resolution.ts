/**
 * Pronoun Resolution Test Scenario
 * Tests if agent correctly resolves pronouns and references
 */

import type { TestScenario } from '../../utils/agents';

export const pronounResolution: TestScenario = {
  name: 'Pronoun Resolution',
  description: 'Test if agent correctly resolves pronouns and references',
  messages: [
    {
      input: 'Do you have the Cifa Mixer Hydraulic Pump A4VTG90?',
      expectations: {
        shouldContain: ['a4vtg90', 'pump'],
      },
    },
    {
      input: 'How much does it cost?',
      expectations: {
        shouldMaintainContext: true,
        contextKeywords: ['price', 'cost', 'pump'],
        shouldReferenceHistory: true,
      },
    },
    {
      input: 'Do you have any alternatives to it?',
      expectations: {
        shouldMaintainContext: true,
        contextKeywords: ['alternative', 'pump'],
        shouldReferenceHistory: true,
      },
    },
    {
      input: 'Which one would you recommend?',
      expectations: {
        shouldMaintainContext: true,
        contextKeywords: ['recommend', 'pump'],
      },
    },
  ],
};
