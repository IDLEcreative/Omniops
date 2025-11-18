/**
 * RLS Fix Executor - Execute SQL steps with error handling
 */

import type { FixStep } from './steps.js';

export interface ExecutionResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ step: string; error: string }>;
}

export async function executeStep(
  step: FixStep,
  executeSQL: (sql: string, name: string) => Promise<any>
): Promise<boolean> {
  try {
    if (step.isCheck) {
      const result = await executeSQL(step.sql, step.name);
      if (result && result.length > 0) {
        result.forEach((row: any) => {
          console.log(`   ${JSON.stringify(row, null, 2)}`);
        });
      } else {
      }
      return true;
    } else {
      process.stdout.write(`⏳ ${step.name}... `);
      await executeSQL(step.sql, step.name);
      return true;
    }
  } catch (error) {
    if (!step.isCheck) {
      console.log(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
    } else {
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return false;
  }
}

export async function executeAllSteps(
  steps: FixStep[],
  executeSQL: (sql: string, name: string) => Promise<any>
): Promise<ExecutionResult> {
  const result: ExecutionResult = {
    successCount: 0,
    errorCount: 0,
    errors: []
  };

  for (const step of steps) {
    const success = await executeStep(step, executeSQL);

    if (!step.isCheck) {
      if (success) {
        result.successCount++;
      } else {
        result.errorCount++;
        result.errors.push({
          step: step.name,
          error: 'Execution failed'
        });
      }
    }

    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return result;
}

export function printSummary(result: ExecutionResult): void {
  console.log('\n' + '='.repeat(60));

  if (result.errorCount > 0) {
    result.errors.forEach(e => {
    });
  }

  if (result.successCount > 0) {
    console.log('  • Wrapped auth.uid() in subqueries for InitPlan optimization');
  }
}
