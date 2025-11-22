/**
 * MAKER Framework - Shared Type Definitions
 *
 * @purpose Centralized type definitions for MAKER framework scripts
 *
 * @flow
 *   1. Import types in any MAKER script
 *   2. → Use consistent interfaces across modules
 *   3. → Return standardized data structures
 *
 * @keyFunctions
 *   N/A - Type definitions only
 *
 * @handles
 *   - Type safety across MAKER framework
 *   - Consistent data structures
 *
 * @returns Type definitions for import
 *
 * @dependencies
 *   - None (standalone types)
 *
 * @consumers
 *   - scripts/maker/voting-v2-complete.ts
 *   - scripts/maker/voting-system.ts
 *   - scripts/maker/battle-test.ts
 *
 * @totalLines 96
 * @estimatedTokens 350 (without header), 450 (with header - 22% savings)
 */

// ============================================================================
// Agent Result Types
// ============================================================================

export interface AgentResult {
  success: boolean;
  task_id: string;
  approach: string;
  changes: {
    files_modified: string[];
    lines_changed: number;
    additions: number;
    deletions: number;
  };
  verification: {
    command: string;
    exit_code: number;
    output: string;
  };
  confidence: number;
  output_tokens?: number;
  raw_output?: string;
  red_flags?: string[];
  agent_id?: string;
  timestamp?: number;
}

// ============================================================================
// Voting Types
// ============================================================================

export interface VotingResult {
  winner: AgentResult | null;
  consensus_reached?: boolean;
  votes: number | Map<string, number>;
  total_attempts: number;
  confidence?: number;
  red_flags_detected?: number;
  consensus_type?: 'immediate' | 'strong' | 'weak' | 'escalated';
  winning_hash?: string | null;
  escalation_needed?: boolean;
  escalation_reason?: string;
}

// ============================================================================
// Red Flag Types
// ============================================================================

export interface RedFlag {
  type: 'excessive_length' | 'malformed_json' | 'hedging_language' | 'repetition' | 'out_of_scope';
  detected: boolean;
  evidence?: string;
}

// ============================================================================
// Reliability Metrics
// ============================================================================

export interface ReliabilityMetrics {
  per_step_accuracy: number;
  total_steps: number;
  predicted_success_rate: number;
  error_rate: number;
  confidence_interval: [number, number];
}

// ============================================================================
// Task Complexity
// ============================================================================

export type TaskComplexity = 'simple' | 'medium' | 'complex';
