import { z } from 'zod';

/**
 * Common validation schemas for MCP tools
 */

export const validateInput = <T>(schema: z.ZodSchema<T>, input: any): T => {
  return schema.parse(input);
};

// Common field schemas
export const stringField = z.string().min(1).max(1000);
export const optionalStringField = z.string().min(1).max(1000).optional();
export const numberField = z.number().int().min(0);
export const booleanField = z.boolean();

// Common parameter schemas
export const limitSchema = z.number().int().min(1).max(1000).default(100);
export const offsetSchema = z.number().int().min(0).default(0);
export const querySchema = z.string().min(1).max(500);
