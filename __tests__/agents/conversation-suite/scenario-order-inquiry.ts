/**
 * Complex Multi-Turn Order Inquiry Test Scenario
 * Tests handling of order-related questions with context
 */

import type { TestScenario } from '../../utils/agents';

export const complexOrderInquiry: TestScenario = {
  name: 'Complex Multi-Turn Order Inquiry',
  description: 'Test handling of order-related questions with context',
  messages: [
    {
      input: 'I want to check on my order',
      expectations: {
        shouldContain: ['email', 'order'],
      },
    },
    {
      input: 'My email is samguy@thompsonsuk.com',
      expectations: {
        shouldContain: ['order'],
        shouldMaintainContext: true,
        contextKeywords: ['order'],
      },
    },
    {
      input: 'Why is it on hold?',
      expectations: {
        shouldMaintainContext: true,
        contextKeywords: ['hold', 'order', 'status'],
        shouldReferenceHistory: true,
      },
    },
    {
      input: 'Can you expedite the shipping?',
      expectations: {
        shouldMaintainContext: true,
        contextKeywords: ['ship', 'order'],
      },
    },
  ],
};
