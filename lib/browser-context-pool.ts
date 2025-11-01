/**
 * Browser Context Pool - Proxy File
 *
 * This file maintains backward compatibility by re-exporting from the modular implementation.
 * The actual implementation is in lib/browser-context-pool/
 */

export * from './browser-context-pool/index';
export { BrowserContextPool } from './browser-context-pool/index';
