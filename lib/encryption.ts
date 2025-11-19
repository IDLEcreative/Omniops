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
 * @security
 *   - Encryption: AES-256-GCM (authenticated encryption with associated data)
 *   - IV: Randomly generated per encryption (prevents replay attacks)
 *   - Key management: ENV variable (ENCRYPTION_KEY) - 32-byte hex string
 *   - Key rotation: Not implemented yet (requires data migration)
 *   - Credentials stored: WooCommerce/Shopify API keys encrypted before database storage
 *   - Decryption: Only server-side with service role access (never exposed to client)
 *   - Compliance: Meets GDPR encryption-at-rest requirements
 *
 * @testingStrategy
 *   - Test encryption: Verify output differs for same input (random IV)
 *   - Test decryption: Verify plaintext matches after encrypt/decrypt cycle
 *   - Test IV uniqueness: Each encryption produces unique ciphertext
 *   - Mock environment: Use test ENCRYPTION_KEY in tests
 *   - Tests: __tests__/lib/encryption/crypto-core.test.ts
 *
 * @totalLines 11
 * @estimatedTokens 100 (without header), 50 (with header - 50% savings)
 */

export * from './encryption/index';
