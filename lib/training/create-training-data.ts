/**
 * Create training data entry
 */

import type { SupabaseClient } from '@/types/supabase';
import { logger } from '@/lib/logger';
import { processTrainingDataAsync } from './process-training-embeddings';

export interface CreateTrainingDataParams {
  userId: string;
  type: string;
  content: string;
  metadata?: any;
  domain: string;
  title?: string;
  adminSupabase: SupabaseClient;
}

export interface CreateTrainingDataResult {
  success: boolean;
  data: {
    id: string;
    type: string;
    content: string;
    status: string;
    createdAt: string;
  };
}

const VALID_TYPES = ['faq', 'product', 'policy', 'guide', 'custom'];

/**
 * Validate training data input
 */
export function validateTrainingDataInput(params: CreateTrainingDataParams): string | null {
  const { type, content, domain } = params;

  if (!type || !content || !domain) {
    return 'Type, content, and domain are required';
  }

  if (!VALID_TYPES.includes(type)) {
    return `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`;
  }

  return null;
}

/**
 * Create training data entry and trigger async processing
 */
export async function createTrainingData(
  params: CreateTrainingDataParams
): Promise<CreateTrainingDataResult> {
  const { userId, type, content, metadata, domain, title, adminSupabase } = params;

  // Create training data entry
  const { data, error } = await adminSupabase
    .from('training_data')
    .insert({
      user_id: userId,
      domain,
      type,
      title: title || null,
      content,
      metadata: metadata || {},
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    logger.error('createTrainingData insert failed', error, {
      userId,
      type,
    });
    throw error;
  }

  // Trigger embedding generation in the background
  processTrainingDataAsync(data.id, content, metadata, adminSupabase, domain);

  return {
    success: true,
    data: {
      id: data.id,
      type: data.type,
      content: data.content,
      status: data.status,
      createdAt: data.created_at,
    }
  };
}
