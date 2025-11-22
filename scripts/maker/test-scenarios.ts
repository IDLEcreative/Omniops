/**
 * MAKER Framework - Test Scenarios
 *
 * @purpose Test scenario configurations for battle testing
 *
 * @flow
 *   1. Import test scenarios
 *   2. → Use in battle tests
 *   3. → Return scenario-specific configurations
 *
 * @keyFunctions
 *   - TEST_SCENARIOS (line 38): Array of test scenarios
 *
 * @handles
 *   - Test scenario configurations
 *   - Expected performance metrics
 *
 * @returns Test scenario definitions
 *
 * @dependencies
 *   - ./types.ts (TaskComplexity)
 *
 * @consumers
 *   - scripts/maker/battle-test.ts
 *
 * @totalLines 92
 * @estimatedTokens 340 (without header), 440 (with header - 23% savings)
 */

import { TaskComplexity } from './types';

export interface TestScenario {
  name: string;
  description: string;
  successRate: number;
  taskComplexity: TaskComplexity;
  expectedK: number;
  expectedAttempts: number;
  expectedEscalation: boolean;
}

export const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Simple ESLint Fixes',
    description: 'Remove unused imports, fix formatting',
    successRate: 0.95,
    taskComplexity: 'simple',
    expectedK: 2,
    expectedAttempts: 3,
    expectedEscalation: false,
  },
  {
    name: 'Dependency Updates',
    description: 'Update package versions, verify builds',
    successRate: 0.90,
    taskComplexity: 'simple',
    expectedK: 2,
    expectedAttempts: 3,
    expectedEscalation: false,
  },
  {
    name: 'Type Extraction',
    description: 'Extract TypeScript types to separate file',
    successRate: 0.85,
    taskComplexity: 'medium',
    expectedK: 2,
    expectedAttempts: 3,
    expectedEscalation: false,
  },
  {
    name: 'File Refactoring',
    description: 'Split 400 LOC file into modules',
    successRate: 0.80,
    taskComplexity: 'medium',
    expectedK: 2,
    expectedAttempts: 3,
    expectedEscalation: false,
  },
  {
    name: 'Complex Algorithm',
    description: 'Refactor O(n²) to O(n) with data structures',
    successRate: 0.40,
    taskComplexity: 'complex',
    expectedK: 2,
    expectedAttempts: 5,
    expectedEscalation: true,
  },
  {
    name: 'Architecture Decision',
    description: 'Design new module architecture',
    successRate: 0.20,
    taskComplexity: 'complex',
    expectedK: 2,
    expectedAttempts: 5,
    expectedEscalation: true,
  },
];
