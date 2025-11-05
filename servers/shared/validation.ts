/**
 * Validation utilities for MCP tools
 *
 * Purpose: Centralized input validation using Zod schemas
 * Category: shared
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 */

import { z, ZodSchema } from 'zod';

/**
 * Validate input against a Zod schema
 * Throws descriptive error if validation fails
 */
export function validateInput<T>(schema: ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${issues}`);
    }
    throw error;
  }
}

/**
 * Validate input and return result object instead of throwing
 */
export function validateInputSafe<T>(
  schema: ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Validation failed: ${issues}` };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown validation error' };
  }
}
