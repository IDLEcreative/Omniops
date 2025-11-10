/**
 * Conversation Scenarios for Production Simulation
 *
 * 20 realistic user conversation scenarios covering corrections,
 * list navigation, pronoun resolution, and mixed patterns.
 */

import type { ConversationScenario } from './conversation-types';
import { correctionScenarios } from './scenarios-corrections';
import { listScenarios } from './scenarios-lists';
import { mixedScenarios } from './scenarios-mixed';

// Export individual scenario categories
export { correctionScenarios } from './scenarios-corrections';
export { listScenarios } from './scenarios-lists';
export { mixedScenarios } from './scenarios-mixed';

// Export all scenarios combined
export const scenarios: ConversationScenario[] = [
  ...correctionScenarios,
  ...listScenarios,
  ...mixedScenarios,
];
