/**
 * Mock for node-fetch v3 (ESM-only)
 *
 * This mock provides a CommonJS-compatible interface for node-fetch
 * to work with Jest, which has issues with ESM modules.
 *
 * For integration tests, we're polyfilling fetch globally in jest.setup.integration.js,
 * so this mock simply delegates to the global fetch.
 */

// Use the global fetch that's polyfilled in jest.setup.integration.js
const nodeFetch = globalThis.fetch;

// Export as CommonJS default
module.exports = nodeFetch;
module.exports.default = nodeFetch;

// Re-export common types and utilities
module.exports.Headers = globalThis.Headers;
module.exports.Request = globalThis.Request;
module.exports.Response = globalThis.Response;
module.exports.FetchError = class FetchError extends Error {
  constructor(message, type, systemError) {
    super(message);
    this.name = 'FetchError';
    this.type = type;
    this.code = systemError?.code;
    this.errno = systemError?.errno;
  }
};
