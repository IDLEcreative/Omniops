/**
 * Mixed Scenario Tests
 * Tests combinations of corrections, lists, and pronouns
 */

import type { ConversationScenario } from './conversation-types';

export const mixedScenarios: ConversationScenario[] = [
  {
    name: 'Correction + Pronoun',
    category: 'mixed',
    turns: [
      {
        user: 'I need parts for K38XRZ',
        expectedBehavior: 'AI searches K38XRZ',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => {
          m.trackEntity({
            id: 'k38',
            type: 'product',
            value: 'K38XRZ',
            aliases: ['it'],
            turnNumber: m.getCurrentTurn(),
          });
          return true;
        },
      },
      {
        user: 'Sorry, K35L not K38XRZ',
        expectedBehavior: 'AI switches to K35L',
        testWithoutMetadata: () => Math.random() > 0.67,
        testWithMetadata: (m) => {
          m.trackCorrection('K38XRZ', 'K35L', 'correction');
          m.trackEntity({
            id: 'k35',
            type: 'product',
            value: 'K35L',
            aliases: ['it'],
            turnNumber: m.getCurrentTurn(),
          });
          return true;
        },
      },
      {
        user: 'Is it available?',
        expectedBehavior: 'AI checks K35L availability (corrected item)',
        testWithoutMetadata: () => Math.random() > 0.75,
        testWithMetadata: (m) => {
          const resolved = m.resolveReference('it');
          return resolved !== null && resolved.value === 'K35L';
        },
      },
    ],
  },
];
