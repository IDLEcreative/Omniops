/**
 * Type Definitions for Production Conversation Simulation
 *
 * Types for simulating realistic conversation scenarios with and without metadata.
 */

import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';

export interface ConversationTurn {
  user: string;
  expectedBehavior: string;
  testWithoutMetadata: () => boolean;
  testWithMetadata: (manager: ConversationMetadataManager) => boolean;
}

export interface ConversationScenario {
  name: string;
  category: 'correction' | 'list' | 'pronoun' | 'mixed';
  turns: ConversationTurn[];
}

export interface SimulationResults {
  scenario: string;
  category: string;
  withoutMetadata: {
    totalTurns: number;
    successfulTurns: number;
    accuracy: number;
  };
  withMetadata: {
    totalTurns: number;
    successfulTurns: number;
    accuracy: number;
  };
  improvement: number;
}
