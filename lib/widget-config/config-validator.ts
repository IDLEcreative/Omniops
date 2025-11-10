/**
 * Widget Configuration Validation
 *
 * Zod schemas and validation utilities for widget configuration API.
 */

import { z } from 'zod';

/**
 * Schema for query parameters
 */
export const QuerySchema = z.object({
  domain: z.string().optional(),
  id: z.string().optional(), // app_id parameter
});

export type QueryParams = z.infer<typeof QuerySchema>;

/**
 * Validate query parameters
 */
export function validateQueryParams(params: unknown): QueryParams {
  return QuerySchema.parse(params);
}

/**
 * Check if query params are empty (no domain or app_id)
 */
export function isEmptyQuery(params: QueryParams): boolean {
  return (
    (!params.domain || params.domain.trim() === '') &&
    (!params.id || params.id.trim() === '')
  );
}
