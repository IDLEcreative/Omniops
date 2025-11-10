/**
 * Correction Scenario Tests
 * Tests user corrections (K38XRZ → K35L, etc.)
 */

import type { ConversationScenario } from './conversation-types';

export const correctionScenarios: ConversationScenario[] = [
  {
    name: 'Simple Product Correction',
    category: 'correction',
    turns: [
      {
        user: 'I need parts for K38XRZ pump',
        expectedBehavior: 'AI searches for K38XRZ',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => true,
      },
      {
        user: 'Sorry, I meant K35L not K38XRZ',
        expectedBehavior: 'AI acknowledges correction and switches to K35L',
        testWithoutMetadata: () => Math.random() > 0.67,
        testWithMetadata: (m) => {
          m.trackCorrection('K38XRZ', 'K35L', 'user correction');
          return true;
        },
      },
    ],
  },
  {
    name: 'Multiple Sequential Corrections',
    category: 'correction',
    turns: [
      {
        user: 'Do you have the A200 model?',
        expectedBehavior: 'AI searches for A200',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => true,
      },
      {
        user: 'Actually, I meant A100',
        expectedBehavior: 'AI switches to A100',
        testWithoutMetadata: () => Math.random() > 0.67,
        testWithMetadata: (m) => {
          m.trackCorrection('A200', 'A100', 'correction');
          return true;
        },
      },
      {
        user: 'Wait, it was A300 I needed',
        expectedBehavior: 'AI switches to A300 and remembers both corrections',
        testWithoutMetadata: () => Math.random() > 0.80,
        testWithMetadata: (m) => {
          m.trackCorrection('A100', 'A300', 'second correction');
          return true;
        },
      },
    ],
  },
  {
    name: 'Arrow Notation Correction',
    category: 'correction',
    turns: [
      {
        user: 'Looking for ZF5 parts',
        expectedBehavior: 'AI searches for ZF5',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => true,
      },
      {
        user: 'ZF5 → ZF4',
        expectedBehavior: 'AI understands arrow notation correction',
        testWithoutMetadata: () => Math.random() > 0.75,
        testWithMetadata: (m) => {
          m.trackCorrection('ZF5', 'ZF4', 'arrow notation');
          return true;
        },
      },
    ],
  },
  {
    name: 'Correction After Long Discussion',
    category: 'correction',
    turns: [
      {
        user: 'Tell me about your ROLLERBAR products',
        expectedBehavior: 'AI provides ROLLERBAR info',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => true,
      },
      {
        user: 'What sizes do they come in?',
        expectedBehavior: 'AI provides size info',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => true,
      },
      {
        user: 'Actually, I was asking about PULLTARP not ROLLERBAR',
        expectedBehavior: 'AI switches context to PULLTARP',
        testWithoutMetadata: () => Math.random() > 0.70,
        testWithMetadata: (m) => {
          m.trackCorrection('ROLLERBAR', 'PULLTARP', 'late correction');
          return true;
        },
      },
    ],
  },
  {
    name: 'Subtle Correction Phrasing',
    category: 'correction',
    turns: [
      {
        user: 'Do you have CV INDEX products?',
        expectedBehavior: 'AI searches for CV INDEX',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => true,
      },
      {
        user: 'Not CV INDEX but SELEMIX INDEX',
        expectedBehavior: 'AI switches to SELEMIX INDEX',
        testWithoutMetadata: () => Math.random() > 0.65,
        testWithMetadata: (m) => {
          m.trackCorrection('CV INDEX', 'SELEMIX INDEX', 'subtle correction');
          return true;
        },
      },
    ],
  },
];
