/**
 * Shared Test Utilities for Dashboard Hooks
 *
 * Common mock factories and fetch response helpers used across
 * dashboard analytics and conversations hook tests.
 */

export function createFetchResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

export function createAbortError(): Error {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

export function createMalformedJSONResponse() {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.reject(new Error('Invalid JSON')),
  } as Response);
}
