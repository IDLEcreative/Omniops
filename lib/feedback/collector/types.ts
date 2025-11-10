/**
 * Feedback System Types & Schemas
 *
 * Provides type definitions and validation schemas for feedback collection
 */

import { z } from 'zod';

// ============================================================================
// Feedback Enums
// ============================================================================

export enum FeedbackType {
  SATISFACTION = 'satisfaction',
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  GENERAL = 'general',
  NPS = 'nps',
}

export enum SatisfactionRating {
  VERY_UNSATISFIED = 1,
  UNSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5,
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const FeedbackSchema = z.object({
  type: z.nativeEnum(FeedbackType),
  rating: z.number().int().min(1).max(5).optional(),
  npsScore: z.number().int().min(0).max(10).optional(),
  message: z.string().min(1).max(2000).optional(),
  category: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
  conversationId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  domain: z.string().optional(),
  userAgent: z.string().optional(),
  url: z.string().url().optional(),
});

export type FeedbackData = z.infer<typeof FeedbackSchema>;
