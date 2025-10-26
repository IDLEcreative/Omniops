// Utility functions for LZ-String compression

/**
 * Base64 alphabet used for compression encoding
 */
export const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

/**
 * Cached reverse dictionary for base64 decoding
 * Populated lazily on first use
 */
let baseReverseDic: { [key: string]: number } | null = null;

/**
 * Get the numeric value for a base64 character
 * Builds reverse dictionary cache on first call
 * @param alphabet - The base64 alphabet string
 * @param character - The character to look up
 * @returns Numeric value of the character in the alphabet
 */
export function getBaseValue(alphabet: string, character: string): number {
  if (!baseReverseDic) {
    baseReverseDic = {};
    for (let i = 0; i < alphabet.length; i++) {
      baseReverseDic[alphabet.charAt(i)] = i;
    }
  }
  return baseReverseDic[character] || 0;
}

/**
 * Clear the base64 reverse dictionary cache
 * Useful for testing or memory management
 */
export function clearBaseValueCache(): void {
  baseReverseDic = null;
}
