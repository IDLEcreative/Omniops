/**
 * Verification Logging
 */

import { createServiceRoleClient } from '../supabase-server';

export async function logVerification(
  conversationId: string,
  customerEmail: string,
  method: string
): Promise<void> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  try {
    // Update conversation with verification status
    await supabase
      .from('conversations')
      .update({
        verification_status: 'verified',
        verified_customer_email: customerEmail
      })
      .eq('id', conversationId);
  } catch (error) {
    console.error('Error logging verification:', error);
  }
}
