/**
 * WooCommerce Webhook Manager
 *
 * Automatically creates and manages WooCommerce webhooks for purchase tracking
 * Users don't need to configure anything - just connect their store!
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import crypto from 'crypto';

interface WebhookConfig {
  topic: string;
  delivery_url: string;
  secret: string;
  name?: string;
}

interface WooCommerceWebhook {
  id: number;
  name: string;
  status: string;
  topic: string;
  delivery_url: string;
  date_created: string;
}

/**
 * Automatically register WooCommerce webhook when user connects their store
 *
 * This is called automatically after WooCommerce credentials are saved
 */
export async function registerWooCommerceWebhook(
  domain: string,
  woocommerceUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<{ success: boolean; webhookId?: number; error?: string }> {
  try {
    console.log(`[WooCommerce Webhook Manager] Registering webhook for ${domain}`);

    // Generate secure webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omniops.co.uk';
    const webhookUrl = `${appUrl}/api/webhooks/woocommerce/order-created`;

    // Check if webhook already exists
    const existingWebhooks = await getWooCommerceWebhooks(
      woocommerceUrl,
      consumerKey,
      consumerSecret
    );

    const alreadyExists = existingWebhooks.find(
      (w) => w.topic === 'order.created' && w.delivery_url === webhookUrl
    );

    if (alreadyExists) {
      console.log(`[WooCommerce Webhook Manager] Webhook already exists (ID: ${alreadyExists.id})`);

      // Update secret in database
      await saveWebhookSecret(domain, webhookSecret, alreadyExists.id);

      return {
        success: true,
        webhookId: alreadyExists.id,
      };
    }

    // Create new webhook
    const webhookConfig: WebhookConfig = {
      name: 'Omniops - Order Tracking',
      topic: 'order.created',
      delivery_url: webhookUrl,
      secret: webhookSecret,
    };

    const webhook = await createWooCommerceWebhook(
      woocommerceUrl,
      consumerKey,
      consumerSecret,
      webhookConfig
    );

    // Save webhook secret to database
    await saveWebhookSecret(domain, webhookSecret, webhook.id);

    console.log(`[WooCommerce Webhook Manager] Webhook created successfully (ID: ${webhook.id})`);

    return {
      success: true,
      webhookId: webhook.id,
    };
  } catch (error) {
    console.error('[WooCommerce Webhook Manager] Failed to register webhook:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Create WooCommerce webhook via REST API
 */
async function createWooCommerceWebhook(
  woocommerceUrl: string,
  consumerKey: string,
  consumerSecret: string,
  config: WebhookConfig
): Promise<WooCommerceWebhook> {
  const url = `${woocommerceUrl}/wp-json/wc/v3/webhooks`;

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create webhook: ${error}`);
  }

  return response.json();
}

/**
 * Get all WooCommerce webhooks
 */
async function getWooCommerceWebhooks(
  woocommerceUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<WooCommerceWebhook[]> {
  const url = `${woocommerceUrl}/wp-json/wc/v3/webhooks`;

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

/**
 * Save webhook secret to database
 */
async function saveWebhookSecret(
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
 * Delete WooCommerce webhook
 */
export async function deleteWooCommerceWebhook(
  domain: string,
  woocommerceUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceRoleClient();

    // Get webhook ID from database
    const { data: config } = await supabase
      .from('customer_configs')
      .select('encrypted_credentials')
      .eq('domain', domain)
      .single();

    if (!config?.encrypted_credentials?.woocommerce_webhook_id) {
      return { success: true }; // Nothing to delete
    }

    const webhookId = config.encrypted_credentials.woocommerce_webhook_id;

    // Delete from WooCommerce
    const url = `${woocommerceUrl}/wp-json/wc/v3/webhooks/${webhookId}?force=true`;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete webhook: ${await response.text()}`);
    }

    // Remove from database
    await supabase
      .from('customer_configs')
      .update({
        encrypted_credentials: {
          woocommerce_webhook_secret: null,
          woocommerce_webhook_id: null,
        },
      })
      .eq('domain', domain);

    console.log(`[WooCommerce Webhook Manager] Webhook deleted (ID: ${webhookId})`);

    return { success: true };
  } catch (error) {
    console.error('[WooCommerce Webhook Manager] Failed to delete webhook:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Check webhook status
 */
export async function checkWooCommerceWebhookStatus(
  domain: string,
  woocommerceUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<{
  exists: boolean;
  active: boolean;
  deliveryUrl?: string;
  webhookId?: number;
}> {
  try {
    const supabase = await createServiceRoleClient();

    const { data: config } = await supabase
      .from('customer_configs')
      .select('encrypted_credentials')
      .eq('domain', domain)
      .single();

    const webhookId = config?.encrypted_credentials?.woocommerce_webhook_id;

    if (!webhookId) {
      return { exists: false, active: false };
    }

    // Get webhook from WooCommerce
    const url = `${woocommerceUrl}/wp-json/wc/v3/webhooks/${webhookId}`;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      return { exists: false, active: false };
    }

    const webhook: WooCommerceWebhook = await response.json();

    return {
      exists: true,
      active: webhook.status === 'active',
      deliveryUrl: webhook.delivery_url,
      webhookId: webhook.id,
    };
  } catch (error) {
    console.error('[WooCommerce Webhook Manager] Failed to check status:', error);
    return { exists: false, active: false };
  }
}
