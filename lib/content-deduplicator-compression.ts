// Main compression module - re-exports LZ-String compression functionality
// Split from 407 LOC to <100 LOC by extracting LZ implementation and utilities

/**
 * Re-export LZString class for backward compatibility
 * Core implementation moved to content-deduplicator-compression-lz.ts
 */
export { LZString } from './content-deduplicator-compression-lz';

/**
 * Re-export compression utilities
 * Utilities moved to content-deduplicator-compression-utils.ts
 */
export {
  BASE64_ALPHABET,
  getBaseValue,
  clearBaseValueCache
} from './content-deduplicator-compression-utils';
