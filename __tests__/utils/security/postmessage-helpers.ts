/**
 * PostMessage Security Test Helpers
 *
 * Reusable utilities for testing postMessage cross-frame communication security.
 */

export const VALID_ORIGIN = 'https://example.com';
export const INVALID_ORIGIN = 'https://malicious-site.com';

/**
 * Creates a MessageEvent with proper typing
 */
export function createMessageEvent(
  data: unknown,
  origin: string
): MessageEvent {
  return new MessageEvent('message', {
    data,
    origin,
  });
}

/**
 * Mock iframe with postMessage capability
 */
export function createMockIframe() {
  return {
    contentWindow: {
      postMessage: jest.fn(),
    },
  } as any;
}

/**
 * Mock parent window with postMessage capability
 */
export function createMockParent() {
  return {
    postMessage: jest.fn(),
  } as any;
}

/**
 * Sets up standard window location mock
 */
export function mockWindowLocation(origin: string) {
  Object.defineProperty(window, 'location', {
    value: {
      origin,
      hostname: origin.replace('https://', '').replace('http://', ''),
      search: '',
    },
    writable: true,
  });
}

/**
 * Creates a message handler that validates origin
 */
export function createSecureMessageHandler(
  expectedOrigin: string,
  fallbackOrigin: string,
  onValidMessage: (data: any) => void
) {
  return (event: MessageEvent) => {
    const validOrigin = expectedOrigin || fallbackOrigin;

    if (event.origin !== validOrigin && event.origin !== fallbackOrigin) {
      console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
      return;
    }

    const data = event.data;
    if (!data || typeof data.type !== 'string') {
      return;
    }

    onValidMessage(data);
  };
}

/**
 * Determines target origin for postMessage
 */
export function getTargetOrigin(configOrigin: string | undefined, fallback: string): string {
  return configOrigin || fallback;
}
