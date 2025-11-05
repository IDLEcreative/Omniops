/**
 * MCP Code Validator
 *
 * 4-stage validation pipeline for AI-generated TypeScript code:
 * 1. Syntax validation
 * 2. Import validation
 * 3. Pattern validation (dangerous code detection)
 * 4. Full validation pipeline
 */

import { ValidationResult } from './types';

/**
 * Dangerous patterns that must be blocked
 */
const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/, reason: 'eval() enables code injection' },
  { pattern: /Function\s*\(/, reason: 'Function() constructor enables code injection' },
  { pattern: /require\s*\([^'"]/, reason: 'Dynamic require() can bypass import validation' },
  { pattern: /import\s*\([^'"]/, reason: 'Dynamic import() can bypass validation' },
  { pattern: /child_process/, reason: 'child_process enables subprocess execution' },
  { pattern: /\.exec\(/, reason: 'exec() can execute shell commands' },
  { pattern: /\.spawn\(/, reason: 'spawn() can create subprocesses' },
  { pattern: /process\.exit/, reason: 'exit() terminates the process' },
  { pattern: /--allow-run/, reason: 'Attempting to escalate Deno permissions' },
  { pattern: /Deno\.run/, reason: 'Deno.run() creates subprocesses' },
  { pattern: /Deno\.Command/, reason: 'Deno.Command() creates subprocesses' },
  { pattern: /--allow-env/, reason: 'Attempting to access environment variables' },
  { pattern: /--allow-sys/, reason: 'Attempting to access system information' },
  { pattern: /--allow-ffi/, reason: 'Attempting to use foreign function interface' },
  { pattern: /new\s+Function/, reason: 'new Function() enables code injection' },
];

/**
 * Allowed import paths
 */
const ALLOWED_IMPORT_PATTERNS = [
  /^\.\/servers\//,
  /^\.\.\/servers\//,
  /^@\/servers\//,
];

/**
 * Phase 1: Validate TypeScript syntax
 */
export function validateSyntax(code: string): ValidationResult {
  const errors: string[] = [];

  // Basic syntax checks
  try {
    // Check for balanced braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced braces in code');
    }

    // Check for balanced parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Unbalanced parentheses in code');
    }

    // Check for basic TypeScript syntax issues
    if (code.includes('function async')) {
      errors.push('Invalid syntax: "function async" should be "async function"');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Syntax validation error: ${errorMessage}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Phase 2: Validate imports
 */
export function validateImports(code: string): ValidationResult {
  const errors: string[] = [];

  // Extract import statements
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  const matches = Array.from(code.matchAll(importRegex));

  for (const match of matches) {
    const importPath = match[1];

    // Check if import is from allowed path
    const isAllowed = ALLOWED_IMPORT_PATTERNS.some(pattern =>
      pattern.test(importPath)
    );

    if (!isAllowed) {
      errors.push(`Forbidden import: "${importPath}". Only imports from ./servers/ are allowed.`);
    }

    // Check for remote imports
    if (importPath.startsWith('http://') || importPath.startsWith('https://')) {
      errors.push(`Remote imports are forbidden: "${importPath}"`);
    }

    // Check for npm package imports
    if (!importPath.startsWith('.') && !importPath.startsWith('/') && !importPath.startsWith('@/')) {
      errors.push(`Direct npm imports are forbidden: "${importPath}". Use MCP servers instead.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Phase 3: Validate against dangerous patterns
 */
export function validatePatterns(code: string): ValidationResult {
  const errors: string[] = [];

  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Dangerous pattern detected: ${reason}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Phase 4: Full validation pipeline
 */
export function validateCode(code: string): ValidationResult {
  const allErrors: string[] = [];

  // Run all validation phases
  const syntaxResult = validateSyntax(code);
  allErrors.push(...syntaxResult.errors);

  const importResult = validateImports(code);
  allErrors.push(...importResult.errors);

  const patternResult = validatePatterns(code);
  allErrors.push(...patternResult.errors);

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}
