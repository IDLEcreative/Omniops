/**
 * Encrypted Credentials Schema
 *
 * Defines the structure for storing all API credentials in a single
 * encrypted JSONB column instead of multiple encrypted TEXT columns.
 *
 * Benefits:
 * - Single encryption/decryption operation per credential set
 * - Easier to add new credential types
 * - Better security through consolidated encryption
 * - Cleaner schema with fewer columns
 */

/**
 * WooCommerce credentials stored in encrypted format
 */
export interface WooCommerceCredentials {
  consumer_key: string;
  consumer_secret: string;
  store_url: string;
}

/**
 * Shopify credentials stored in encrypted format
 */
export interface ShopifyCredentials {
  access_token: string;
  store_url: string;
  api_version?: string;
  webhook_secret?: string; // Dedicated webhook verification secret (different from access_token)
}

/**
 * Complete credential set for a customer configuration
 * This object gets encrypted and stored in the encrypted_credentials JSONB column
 */
export interface EncryptedCredentials {
  woocommerce?: WooCommerceCredentials;
  shopify?: ShopifyCredentials;
  // Future: stripe, square, etc.
}

/**
 * The encrypted storage format (after encryption)
 * This is what actually gets stored in the database
 */
export interface EncryptedCredentialStorage {
  iv: string;        // Initialization vector (hex)
  data: string;      // Encrypted payload (hex)
  authTag: string;   // Authentication tag for GCM mode (hex)
}

/**
 * Backward compatibility: Plaintext column names
 * These are deprecated and should be migrated to encrypted_credentials
 */
export interface LegacyCredentialColumns {
  woocommerce_consumer_key?: string;
  woocommerce_consumer_secret?: string;
  woocommerce_url?: string;
  shopify_access_token?: string;
  shopify_shop?: string;
}

/**
 * Type guard to check if credentials are in legacy format
 */
export function hasLegacyCredentials(config: any): config is LegacyCredentialColumns {
  return (
    config.woocommerce_consumer_key !== undefined ||
    config.shopify_access_token !== undefined
  );
}

/**
 * Type guard to check if credentials are in new encrypted format
 */
export function hasEncryptedCredentials(config: any): boolean {
  return config.encrypted_credentials !== null && config.encrypted_credentials !== undefined;
}
