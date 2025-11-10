/**
 * Autonomous Agent Types
 * @module lib/autonomous/core/base-agent-types
 */

export interface TaskStep {
  order: number;
  intent: string;
  action: string;
  target?: string;
  value?: string;
  expectedResult: string;
  alternatives?: string[];
}

export interface ExecutionContext {
  operationId: string;
  organizationId: string;
  userId?: string;
  service: string;
  operation: string;
  credentials?: Record<string, string>;
  headless?: boolean;
  slowMo?: number;
}

export interface OperationResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  stepsExecuted: number;
  stepsSucceeded: number;
  stepsFailed: number;
}

export interface StepExecutionResult {
  stepNumber: number;
  success: boolean;
  duration: number;
  screenshot?: string;
  error?: string;
}
