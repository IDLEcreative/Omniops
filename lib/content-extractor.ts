/**
 * Content Extractor - Proxy File
 *
 * This file maintains backward compatibility by re-exporting from the modular implementation.
 * The actual implementation is in lib/content-extractor/
 */

export * from './content-extractor/index';
export { ContentExtractor } from './content-extractor/index';
