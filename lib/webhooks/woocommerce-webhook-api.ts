/**
 * WooCommerce Webhook API Operations
 *
 * Handles all WooCommerce REST API interactions for webhooks
 */

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
 * Create WooCommerce webhook via REST API
 */
export async function createWooCommerceWebhook(
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
export async function getWooCommerceWebhooks(
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
 * Get single webhook by ID
 */
export async function getWooCommerceWebhook(
  woocommerceUrl: string,
  consumerKey: string,
  consumerSecret: string,
  webhookId: number
): Promise<WooCommerceWebhook | null> {
  const url = `${woocommerceUrl}/wp-json/wc/v3/webhooks/${webhookId}`;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

/**
 * Delete webhook by ID
 */
export async function deleteWooCommerceWebhookById(
  woocommerceUrl: string,
  consumerKey: string,
  consumerSecret: string,
  webhookId: number
): Promise<boolean> {
  const url = `${woocommerceUrl}/wp-json/wc/v3/webhooks/${webhookId}?force=true`;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  // Success if deleted or already gone
  return response.ok || response.status === 404;
}
