/**
 * WooCommerce Credential Encryption
 */

import { encrypt, tryDecrypt } from './crypto-core';
import type { WooCommerceConfig } from './types';

export function encryptWooCommerceConfig(config: WooCommerceConfig): WooCommerceConfig {
  return {
    enabled: config.enabled,
    url: config.url,
    consumer_key: config.consumer_key ? encrypt(config.consumer_key) : undefined,
    consumer_secret: config.consumer_secret ? encrypt(config.consumer_secret) : undefined,
  };
}

export function decryptWooCommerceConfig(config: WooCommerceConfig): WooCommerceConfig {
  return {
    enabled: config.enabled,
    url: config.url,
    consumer_key: config.consumer_key ? tryDecrypt(config.consumer_key) : undefined,
    consumer_secret: config.consumer_secret ? tryDecrypt(config.consumer_secret) : undefined,
  };
}
