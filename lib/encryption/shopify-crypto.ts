/**
 * Shopify Credential Encryption
 */

import { encrypt, decrypt } from './crypto-core';
import type { ShopifyConfig } from './types';

export function encryptShopifyConfig(config: ShopifyConfig): ShopifyConfig {
  return {
    enabled: config.enabled,
    domain: config.domain,
    access_token: config.access_token ? encrypt(config.access_token) : undefined,
  };
}

export function decryptShopifyConfig(config: ShopifyConfig): ShopifyConfig {
  return {
    enabled: config.enabled,
    domain: config.domain,
    access_token: config.access_token ? decrypt(config.access_token) : undefined,
  };
}
