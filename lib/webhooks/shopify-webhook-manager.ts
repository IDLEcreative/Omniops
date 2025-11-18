/**
 * Shopify Webhook Manager
 *
 * Automatically creates and manages Shopify webhooks for purchase tracking
 * Users don't need to configure anything - just connect their store!
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

interface ShopifyWebhook {
  id: number;
  address: string;
  topic: string;
  created_at: string;
  updated_at: string;
  format: string;
}

/**
 * Automatically register Shopify webhook when user connects their store
 */
export async function registerShopifyWebhook(
  domain: string,
  shopDomain: string,
  accessToken: string
): Promise<{ success: boolean; webhookId?: number; error?: string }> {
  try {

    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omniops.co.uk';
    const webhookUrl = `${appUrl}/api/webhooks/shopify/order-created`;

    // Check if webhook already exists
    const existingWebhooks = await getShopifyWebhooks(shopDomain, accessToken);

    const alreadyExists = existingWebhooks.find(
      (w) => w.topic === 'orders/create' && w.address === webhookUrl
    );

    if (alreadyExists) {
      console.log(`[Shopify Webhook Manager] Webhook already exists (ID: ${alreadyExists.id})`);

      // Update webhook ID in database
      await saveWebhookId(domain, alreadyExists.id);

      return {
        success: true,
        webhookId: alreadyExists.id,
      };
    }

    // Create new webhook
    const webhook = await createShopifyWebhook(shopDomain, accessToken, webhookUrl);

    // Save webhook ID to database
    await saveWebhookId(domain, webhook.id);

    console.log(`[Shopify Webhook Manager] Webhook created successfully (ID: ${webhook.id})`);

    return {
      success: true,
      webhookId: webhook.id,
    };
  } catch (error) {
    console.error('[Shopify Webhook Manager] Failed to register webhook:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Create Shopify webhook via Admin API
 */
async function createShopifyWebhook(
  shopDomain: string,
  accessToken: string,
  webhookUrl: string
): Promise<ShopifyWebhook> {
  const url = `https://${shopDomain}/admin/api/2024-01/webhooks.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      webhook: {
        topic: 'orders/create',
        address: webhookUrl,
        format: 'json',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Shopify webhook: ${error}`);
  }

  const data = await response.json();
  return data.webhook;
}

/**
 * Get all Shopify webhooks
 */
async function getShopifyWebhooks(
  shopDomain: string,
  accessToken: string
): Promise<ShopifyWebhook[]> {
  const url = `https://${shopDomain}/admin/api/2024-01/webhooks.json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': accessToken,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.webhooks || [];
}

/**
 * Save webhook ID to database
 */
async function saveWebhookId(domain: string, webhookId: number): Promise<void> {
  const supabase = await createServiceRoleClient();

  const { data: config } = await supabase
    .from('customer_configs')
    .select('encrypted_credentials')
    .eq('domain', domain)
    .single();

  const credentials = config?.encrypted_credentials || {};

  const { error } = await supabase
    .from('customer_configs')
    .update({
      encrypted_credentials: {
        ...credentials,
        shopify_webhook_id: webhookId,
      },
    })
    .eq('domain', domain);

  if (error) {
    console.error('[Shopify Webhook Manager] Failed to save webhook ID:', error);
    throw error;
  }
}

/**
 * Delete Shopify webhook
 */
export async function deleteShopifyWebhook(
  domain: string,
  shopDomain: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceRoleClient();

    // Get webhook ID from database
    const { data: config } = await supabase
      .from('customer_configs')
      .select('encrypted_credentials')
      .eq('domain', domain)
      .single();

    if (!config?.encrypted_credentials?.shopify_webhook_id) {
      return { success: true }; // Nothing to delete
    }

    const webhookId = config.encrypted_credentials.shopify_webhook_id;

    // Delete from Shopify
    const url = `https://${shopDomain}/admin/api/2024-01/webhooks/${webhookId}.json`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete webhook: ${await response.text()}`);
    }

    // Remove from database
    const credentials = config.encrypted_credentials;
    delete credentials.shopify_webhook_id;

    await supabase
      .from('customer_configs')
      .update({
        encrypted_credentials: credentials,
      })
      .eq('domain', domain);

    console.log(`[Shopify Webhook Manager] Webhook deleted (ID: ${webhookId})`);

    return { success: true };
  } catch (error) {
    console.error('[Shopify Webhook Manager] Failed to delete webhook:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Check webhook status
 */
export async function checkShopifyWebhookStatus(
  domain: string,
  shopDomain: string,
  accessToken: string
): Promise<{
  exists: boolean;
  active: boolean;
  address?: string;
  webhookId?: number;
}> {
  try {
    const supabase = await createServiceRoleClient();

    const { data: config } = await supabase
      .from('customer_configs')
      .select('encrypted_credentials')
      .eq('domain', domain)
      .single();

    const webhookId = config?.encrypted_credentials?.shopify_webhook_id;

    if (!webhookId) {
      return { exists: false, active: false };
    }

    // Get webhook from Shopify
    const url = `https://${shopDomain}/admin/api/2024-01/webhooks/${webhookId}.json`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      return { exists: false, active: false };
    }

    const data = await response.json();
    const webhook: ShopifyWebhook = data.webhook;

    return {
      exists: true,
      active: true, // Shopify webhooks don't have active/inactive status
      address: webhook.address,
      webhookId: webhook.id,
    };
  } catch (error) {
    console.error('[Shopify Webhook Manager] Failed to check status:', error);
    return { exists: false, active: false };
  }
}
