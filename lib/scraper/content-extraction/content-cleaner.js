/**
 * Content Cleaner
 * Cleans and normalizes extracted content
 */

import crypto from 'crypto';

/**
 * Cleans extracted content
 * Removes excessive whitespace, empty links, and broken images
 *
 * @param {string} content - Raw content text
 * @returns {string} Cleaned content
 */
export function cleanContent(content) {
  return content
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .replace(/\s+$/gm, '') // Remove trailing spaces
    .replace(/^\s+/gm, '') // Remove leading spaces
    .replace(/\[(.+?)\]\(\)/g, '$1') // Remove empty links
    .replace(/!\[(.+?)\]\(\)/g, '') // Remove broken images
    .trim();
}

/**
 * Generates a content hash for deduplication
 * Normalizes content before hashing for consistent results
 *
 * @param {string} content - Content to hash
 * @returns {string} First 16 characters of SHA-256 hash
 */
export function generateContentHash(content) {
  // Normalize content for hashing
  const normalized = content
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();

  return crypto.createHash('sha256')
    .update(normalized)
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for efficiency
}

/**
 * Generates a SHA-256 hash for content chunks
 * Used for detecting duplicate chunks across pages
 *
 * @param {string} text - Text chunk to hash
 * @returns {string} Full SHA-256 hash
 */
export function generateChunkHash(text) {
  // Normalize text for consistent hashing
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();

  return crypto.createHash('sha256')
    .update(normalized)
    .digest('hex');
}
