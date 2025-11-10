/**
 * Complex Topic Weaving Test Scenario
 * Tests handling of multiple interwoven topics
 */

import type { TestScenario } from '../../utils/agents';

export const complexTopicWeaving: TestScenario = {
  name: 'Complex Topic Weaving',
  description: 'Test handling of multiple interwoven topics',
  messages: [
    {
      input: 'I need a pump for my Cifa mixer and also some spare seals',
      expectations: {
        shouldContain: ['pump', 'cifa', 'seals'],
      },
    },
    {
      input: 'Let\'s focus on the pump first. What options do I have?',
      expectations: {
        shouldContain: ['pump', 'option'],
        shouldMaintainContext: true,
        contextKeywords: ['pump', 'cifa'],
      },
    },
    {
      input: 'OK, and for the seals?',
      expectations: {
        shouldContain: ['seal'],
        shouldReferenceHistory: true,
      },
    },
    {
      input: 'Can I get a discount if I buy both?',
      expectations: {
        shouldContain: ['discount', 'both'],
        shouldReferenceHistory: true,
        shouldMaintainContext: true,
        contextKeywords: ['pump', 'seal'],
      },
    },
    {
      input: 'What\'s the total if I get the A4VTG90 pump and a seal kit?',
      expectations: {
        shouldContain: ['total', 'a4vtg90', 'seal'],
        shouldReferenceHistory: true,
      },
    },
  ],
};
