/**
 * Encryption Types
 */

import type { EncryptedCredentials } from '@/types/encrypted-credentials';

export type { EncryptedCredentials };

export interface WooCommerceConfig {
  enabled: boolean;
  url?: string;
  consumer_key?: string;
  consumer_secret?: string;
}

export interface ShopifyConfig {
  enabled: boolean;
  domain?: string;
  access_token?: string;
}

export interface EncryptionConstants {
  ALGORITHM: string;
  IV_LENGTH: number;
  TAG_LENGTH: number;
  SALT_LENGTH: number;
}
