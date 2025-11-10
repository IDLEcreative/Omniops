/**
 * Topic Switching and Return Test Scenario
 * Tests if the agent can handle topic changes and return to previous topics
 */

import type { TestScenario } from '../../utils/agents';

export const topicSwitchingAndReturn: TestScenario = {
  name: 'Topic Switching and Return',
  description: 'Test if the agent can handle topic changes and return to previous topics',
  messages: [
    {
      input: 'What hydraulic pumps do you have for Cifa mixers?',
      expectations: {
        shouldContain: ['pump', 'cifa'],
      },
    },
    {
      input: 'Actually, do you ship internationally?',
      expectations: {
        shouldContain: ['ship'],
        shouldNotContain: ['pump'],
      },
    },
    {
      input: 'How much does shipping to France cost?',
      expectations: {
        shouldMaintainContext: true,
        contextKeywords: ['france', 'ship', 'cost'],
      },
    },
    {
      input: 'OK, back to the pumps - what was the price of the A4VTG90?',
      expectations: {
        shouldContain: ['pump', 'a4vtg90'],
        shouldReferenceHistory: true,
        shouldMaintainContext: true,
        contextKeywords: ['pump', 'price'],
      },
    },
  ],
};
