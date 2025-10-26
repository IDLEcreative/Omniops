// LZ-String compression implementation for content deduplication
// Based on LZ77 compression algorithm with Base64 encoding

import { BASE64_ALPHABET, getBaseValue } from './content-deduplicator-compression-utils';
import { lzCompress } from './content-deduplicator-compression-lz-compress';
import { lzDecompress } from './content-deduplicator-compression-lz-decompress';

/**
 * LZ-String compression implementation
 * Provides efficient string compression using LZ77 algorithm
 */
export class LZString {
  /**
   * Compress a string to Base64-encoded format
   * @param input - String to compress
   * @returns Base64-encoded compressed string
   */
  static compressToBase64(input: string): string {
    if (input === null || input === "") return "";
    return lzCompress(input, 6, (val) => BASE64_ALPHABET.charAt(val));
  }

  /**
   * Decompress a Base64-encoded string
   * @param input - Base64-encoded compressed string
   * @returns Decompressed original string
   */
  static decompressFromBase64(input: string): string {
    if (input === null || input === "") return "";
    const result = lzDecompress(input.length, 32, (index: number) =>
      getBaseValue(BASE64_ALPHABET, input.charAt(index))
    );
    return result || "";
  }
}
