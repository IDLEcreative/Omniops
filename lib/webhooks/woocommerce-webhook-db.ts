/**
 * WooCommerce Webhook Database Operations
 *
 * Handles all database operations for webhook management
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Save webhook secret and ID to database
 */
export async function saveWebhookSecret(
  domain: string,
  secret: string,
  webhookId: number
): Promise<void> {
  const supabase = await createServiceRoleClient();

  const { error } = await supabase
    .from('customer_configs')
    .update({
      encrypted_credentials: {
        woocommerce_webhook_secret: secret,
        woocommerce_webhook_id: webhookId,
      },
    })
    .eq('domain', domain);

  if (error) {
    console.error('[WooCommerce Webhook Manager] Failed to save secret:', error);
    throw error;
  }
}

/**
 * Get webhook ID from database
 */
export async function getWebhookIdFromDb(domain: string): Promise<number | null> {
  const supabase = await createServiceRoleClient();

  const { data: config } = await supabase
    .from('customer_configs')
    .select('encrypted_credentials')
    .eq('domain', domain)
    .single();

  return config?.encrypted_credentials?.woocommerce_webhook_id || null;
}

/**
 * Remove webhook data from database
 */
export async function removeWebhookFromDb(domain: string): Promise<void> {
  const supabase = await createServiceRoleClient();

  await supabase
    .from('customer_configs')
    .update({
      encrypted_credentials: {
        woocommerce_webhook_secret: null,
        woocommerce_webhook_id: null,
      },
    })
    .eq('domain', domain);
}
