/**
 * Request Validator
 *
 * Defines Zod schemas for validating chat API requests.
 * Ensures all incoming requests meet required format and constraints.
 */

import { z } from 'zod';

/**
 * Chat request validation schema
 *
 * Validates:
 * - Message content (1-5000 characters)
 * - Optional conversation ID (UUID format)
 * - Required session ID
 * - Optional domain and demo ID
 * - Optional configuration for features and AI settings
 */
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  conversation_id: z.string().uuid().optional(),
  session_id: z.string().min(1),
  domain: z.string().optional(),
  demoId: z.string().optional(),
  config: z.object({
    features: z.object({
      woocommerce: z.object({ enabled: z.boolean() }).optional(),
      websiteScraping: z.object({ enabled: z.boolean() }).optional(),
    }).optional(),
    ai: z.object({
      /**
       * Maximum number of AI search iterations before fallback
       * Increased from 3 to 5 to prevent legitimate product/order lookups from timing out.
       * Allows for: initial search, semantic fallback, category refinement, alternative strategies, and verification.
       * @default 5
       */
      maxSearchIterations: z.number().min(1).max(5).optional().default(5),
      searchTimeout: z.number().min(1000).max(30000).optional().default(10000),
    }).optional(),
  }).optional(),
});

/**
 * Inferred TypeScript type from the schema
 */
export type ChatRequestData = z.infer<typeof ChatRequestSchema>;
