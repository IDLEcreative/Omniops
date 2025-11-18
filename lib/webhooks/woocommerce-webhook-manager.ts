/**
 * WooCommerce Webhook Manager
 *
 * Main orchestrator for webhook registration and management
 */

import crypto from 'crypto';
import {
  createWooCommerceWebhook,
  getWooCommerceWebhooks,
  getWooCommerceWebhook,
  deleteWooCommerceWebhookById
} from './woocommerce-webhook-api';
import {
  saveWebhookSecret,
  getWebhookIdFromDb,
  removeWebhookFromDb
} from './woocommerce-webhook-db';

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
    const webhook = await createWooCommerceWebhook(
      woocommerceUrl,
      consumerKey,
      consumerSecret,
      {
        name: 'Omniops - Order Tracking',
        topic: 'order.created',
        delivery_url: webhookUrl,
        secret: webhookSecret,
      }
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
 * Delete WooCommerce webhook
 */
export async function deleteWooCommerceWebhook(
  domain: string,
  woocommerceUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get webhook ID from database
    const webhookId = await getWebhookIdFromDb(domain);

    if (!webhookId) {
      return { success: true }; // Nothing to delete
    }

    // Delete from WooCommerce
    const deleted = await deleteWooCommerceWebhookById(
      woocommerceUrl,
      consumerKey,
      consumerSecret,
      webhookId
    );

    if (!deleted) {
      throw new Error('Failed to delete webhook from WooCommerce');
    }

    // Remove from database
    await removeWebhookFromDb(domain);

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
    // Get webhook ID from database
    const webhookId = await getWebhookIdFromDb(domain);

    if (!webhookId) {
      return { exists: false, active: false };
    }

    // Get webhook from WooCommerce
    const webhook = await getWooCommerceWebhook(
      woocommerceUrl,
      consumerKey,
      consumerSecret,
      webhookId
    );

    if (!webhook) {
      return { exists: false, active: false };
    }

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
