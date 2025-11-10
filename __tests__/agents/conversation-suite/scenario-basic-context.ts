/**
 * Basic Context Retention Test Scenario
 * Tests if the agent remembers information from earlier in the conversation
 */

import type { TestScenario } from '../../utils/agents';

export const basicContextRetention: TestScenario = {
  name: 'Basic Context Retention',
  description: 'Test if the agent remembers information from earlier in the conversation',
  messages: [
    {
      input: 'I need a hydraulic pump for my Cifa mixer',
      expectations: {
        shouldContain: ['pump', 'cifa'],
        shouldMaintainContext: true,
        contextKeywords: ['pump', 'hydraulic', 'cifa'],
      },
    },
    {
      input: 'What models do you have available?',
      expectations: {
        shouldMaintainContext: true,
        contextKeywords: ['pump', 'model', 'hydraulic'],
        shouldReferenceHistory: false,
      },
    },
    {
      input: 'Tell me more about the first one',
      expectations: {
        shouldMaintainContext: true,
        contextKeywords: ['pump'],
        shouldReferenceHistory: true,
      },
    },
  ],
};
