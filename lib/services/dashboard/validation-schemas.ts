/**
 * Validation Schemas for Dashboard APIs
 */

import { z } from 'zod';

export const ConversationsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(7),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().datetime().optional().nullable(),
});

export type ConversationsQuery = z.infer<typeof ConversationsQuerySchema>;
