/**
 * Conversation Simulation Engine
 *
 * Simulates conversation scenarios with and without metadata tracking,
 * calculates accuracy improvements.
 */

import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';
import { ConversationScenario, SimulationResults } from './conversation-types';

/**
 * Simulate a single conversation scenario
 */
export function simulateScenario(scenario: ConversationScenario): SimulationResults {
  let withoutSuccess = 0;
  let withSuccess = 0;
  const totalTurns = scenario.turns.length;

  const metadataManager = new ConversationMetadataManager();

  scenario.turns.forEach((turn, index) => {
    metadataManager.incrementTurn();

    // Test without metadata
    if (turn.testWithoutMetadata()) {
      withoutSuccess++;
    }

    // Test with metadata
    if (turn.testWithMetadata(metadataManager)) {
      withSuccess++;
    }
  });

  const withoutAccuracy = (withoutSuccess / totalTurns) * 100;
  const withAccuracy = (withSuccess / totalTurns) * 100;

  return {
    scenario: scenario.name,
    category: scenario.category,
    withoutMetadata: {
      totalTurns,
      successfulTurns: withoutSuccess,
      accuracy: withoutAccuracy,
    },
    withMetadata: {
      totalTurns,
      successfulTurns: withSuccess,
      accuracy: withAccuracy,
    },
    improvement: withAccuracy - withoutAccuracy,
  };
}

/**
 * Calculate average accuracy from simulation results
 */
export function calculateAverage(
  items: SimulationResults[],
  key: 'withoutMetadata' | 'withMetadata'
): number {
  const sum = items.reduce((acc, item) => acc + item[key].accuracy, 0);
  return sum / items.length;
}

/**
 * Group results by category
 */
export function groupByCategory(results: SimulationResults[]) {
  return {
    correction: results.filter((r) => r.category === 'correction'),
    list: results.filter((r) => r.category === 'list'),
    pronoun: results.filter((r) => r.category === 'pronoun'),
    mixed: results.filter((r) => r.category === 'mixed'),
  };
}
