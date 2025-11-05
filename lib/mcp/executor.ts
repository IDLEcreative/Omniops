/**
 * MCP Executor
 *
 * Deno-based code execution sandbox for running AI-generated TypeScript code safely.
 */

import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { validateCode } from './validator';
import { ExecutionContext, ExecutionResult, CodeExecutionOptions } from './types';

/**
 * Execute TypeScript code in Deno sandbox
 */
export async function executeCode(
  code: string,
  context: ExecutionContext,
  options: CodeExecutionOptions = {}
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    // Step 1: Validate code
    const validation = validateCode(code);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Code validation failed',
          details: validation.errors
        },
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }

    // Step 2: Prepare execution environment
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const tempDir = `/tmp/mcp-execution/${executionId}`;
    const scriptPath = join(tempDir, 'script.ts');

    await mkdir(tempDir, { recursive: true });

    // Step 3: Inject context into code
    const wrappedCode = `
// Execution Context (read-only)
const __CONTEXT__ = ${JSON.stringify(context)};

// Helper function to get context
function getContext() {
  return __CONTEXT__;
}

// User code starts here
${code}
`;

    await writeFile(scriptPath, wrappedCode, 'utf-8');

    // Step 4: Execute with Deno
    const timeout = options.timeout || 30000;
    const result = await executeDeno(scriptPath, tempDir, timeout);

    // Step 5: Cleanup
    await unlink(scriptPath).catch(() => {}); // Ignore cleanup errors

    return {
      success: true,
      data: result,
      metadata: {
        executionTime: Date.now() - startTime
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: errorMessage,
        details: error
      },
      metadata: {
        executionTime: Date.now() - startTime
      }
    };
  }
}

/**
 * Execute Deno with proper permissions
 */
async function executeDeno(
  scriptPath: string,
  workingDir: string,
  timeout: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    const denoPath = process.env.DENO_PATH || 'deno';

    const args = [
      'run',
      '--allow-read=./servers',           // Read MCP servers only
      '--allow-write=' + workingDir,      // Write to temp only
      '--no-prompt',                      // Never prompt for permissions
      '--no-remote',                      // Block remote imports
      '--quiet',                          // Minimize output
      scriptPath
    ];

    const child = spawn(denoPath, args, {
      cwd: process.cwd(),
      timeout
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        try {
          // Try to parse as JSON
          const result = JSON.parse(stdout.trim() || '{}');
          resolve(result);
        } catch {
          // Return as string if not JSON
          resolve({ output: stdout.trim() });
        }
      } else {
        reject(new Error(`Deno execution failed: ${stderr || 'Unknown error'}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });

    // Timeout handling
    setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => {
        child.kill('SIGKILL');
      }, 5000);
      reject(new Error('Execution timeout exceeded'));
    }, timeout);
  });
}
