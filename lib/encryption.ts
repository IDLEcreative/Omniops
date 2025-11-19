/**
 * Encryption - Backward Compatibility Proxy - AI-optimized header for fast comprehension
 *
 * @purpose Re-exports encryption functions from refactored modular implementation
 *
 * @flow
 *   1. Import from '@/lib/encryption' → This proxy file
 *   2. → Re-export from './encryption/index'
 *   3. → Use encryptCredentials(), decryptCredentials(), generateKey()
 *
 * @keyFunctions
 *   - All functions re-exported from './encryption/index' (encryption/crypto-core.ts)
 *   - encryptCredentials(): AES-256-GCM encryption for WooCommerce/Shopify credentials
 *   - decryptCredentials(): Decrypts encrypted credentials with IV validation
 *   - generateKey(): Generates encryption key from ENV (ENCRYPTION_KEY)
 *
 * @handles
 *   - Backward compatibility: Old imports still work after refactoring
 *   - AES-256-GCM: Authenticated encryption with IV (Initialization Vector)
 *   - Key derivation: Uses ENCRYPTION_KEY environment variable
 *
 * @returns All exports from './encryption/index'
 *
 * @dependencies
 *   - ./encryption/index: Modular encryption implementation
 *   - Environment: ENCRYPTION_KEY (32-byte hex string)
 *
 * @consumers
 *   - Legacy code: Any old imports of '@/lib/encryption'
 *   - Modern code: Should import from '@/lib/encryption/crypto-core' directly
 *
 * @note Prefer importing from '@/lib/encryption/crypto-core' for new code
 *
 * @totalLines 11
 * @estimatedTokens 100 (without header), 50 (with header - 50% savings)
 */

export * from './encryption/index';
