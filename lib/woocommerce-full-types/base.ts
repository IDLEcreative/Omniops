import { z } from 'zod';

/**
 * Shared base schemas used across all WooCommerce types
 */

export const BaseSchema = z.object({
  id: z.number(),
  date_created: z.string(),
  date_modified: z.string(),
});

export const MetaDataSchema = z.object({
  id: z.number(),
  key: z.string(),
  value: z.any(),
});

/**
 * Batch operation types for bulk create/update/delete operations
 */
export interface BatchOperation<T> {
  create?: Partial<T>[];
  update?: Array<{ id: number } & Partial<T>>;
  delete?: number[];
}

export interface BatchResponse<T> {
  create: T[];
  update: T[];
  delete: Array<{ id: number }>;
}
