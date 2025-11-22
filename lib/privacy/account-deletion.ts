/**
 * Account Deletion Helpers
 * Functions for scheduled account deletion with 30-day cooling-off period
 * Complies with GDPR Article 17 (Right to be Forgotten)
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

export interface DeletionRequest {
  user_id: string;
  scheduled_for: string;
  ip_address: string;
  status: 'pending' | 'cancelled' | 'completed';
}

/**
 * Create a scheduled account deletion request
 * User has 30 days to cancel before permanent deletion
 */
export async function createAccountDeletionRequest(
  data: Omit<DeletionRequest, 'status'>
) {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database unavailable');

  const { error } = await supabase
    .from('account_deletion_requests')
    .insert({
      user_id: data.user_id,
      scheduled_for: data.scheduled_for,
      ip_address: data.ip_address,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
}

/**
 * Get pending deletion request for a user
 */
export async function getPendingDeletionRequest(userId: string) {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database unavailable');

  const { data, error } = await supabase
    .from('account_deletion_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Cancel a pending account deletion request
 */
export async function cancelAccountDeletionRequest(userId: string) {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database unavailable');

  const { error } = await supabase
    .from('account_deletion_requests')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
}

/**
 * Process all scheduled deletions that have reached their scheduled date
 * Called by background cron job
 */
export async function processScheduledDeletions() {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database unavailable');

  // Get all pending deletions that are due
  const { data: deletions, error: fetchError } = await supabase
    .from('account_deletion_requests')
    .select('user_id, scheduled_for')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString());

  if (fetchError) throw fetchError;

  if (!deletions || deletions.length === 0) {
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;

  // Process each deletion
  for (const deletion of deletions) {
    try {
      // Delete all user data (conversations will cascade)
      await supabase
        .from('conversations')
        .delete()
        .eq('user_id', deletion.user_id);

      // Mark deletion as completed
      await supabase
        .from('account_deletion_requests')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('user_id', deletion.user_id);

      processed++;
    } catch (err) {
      console.error(`Error deleting account ${deletion.user_id}:`, err);
      errors++;
    }
  }

  return { processed, errors };
}

/**
 * Check if user has a pending deletion scheduled
 */
export async function hasScheduledDeletion(userId: string): Promise<boolean> {
  const request = await getPendingDeletionRequest(userId);
  return !!request;
}

/**
 * Get days remaining until scheduled deletion
 */
export async function getDaysUntilDeletion(
  userId: string
): Promise<number | null> {
  const request = await getPendingDeletionRequest(userId);
  if (!request) return null;

  const scheduled = new Date(request.scheduled_for);
  const now = new Date();
  const diffTime = scheduled.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}
