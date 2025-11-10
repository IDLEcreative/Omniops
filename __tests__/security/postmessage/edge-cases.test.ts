/**
 * Edge Cases and Error Conditions Tests
 *
 * Tests edge cases including multiple origins, XSS attempts,
 * and empty environment variables.
 */

import {
  VALID_ORIGIN,
  INVALID_ORIGIN,
  createMessageEvent,
  mockWindowLocation,
  createSecureMessageHandler,
} from '../../utils/security/postmessage-helpers';

describe('postMessage Security - Edge Cases', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    process.env.NEXT_PUBLIC_APP_URL = VALID_ORIGIN;
    mockWindowLocation(VALID_ORIGIN);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should handle multiple trusted origins (env var and location)', () => {
    const handler = jest.fn();
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    window.addEventListener(
      'message',
      createSecureMessageHandler(expectedOrigin, window.location.origin, handler)
    );

    // Test with env var origin
    const event1 = createMessageEvent(
      { type: 'test', payload: 'data1' },
      VALID_ORIGIN
    );
    window.dispatchEvent(event1);

    // Test with location origin
    const event2 = createMessageEvent(
      { type: 'test', payload: 'data2' },
      window.location.origin
    );
    window.dispatchEvent(event2);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should block XSS attempt through malicious payload', () => {
    const handler = jest.fn();
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    window.addEventListener(
      'message',
      createSecureMessageHandler(expectedOrigin, window.location.origin, handler)
    );

    const xssPayload = '<script>alert("XSS")</script>';
    const event = createMessageEvent(
      { type: 'message', payload: xssPayload },
      INVALID_ORIGIN
    );
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[ChatWidget] Blocked message from untrusted origin:',
      INVALID_ORIGIN
    );
  });

  it('should handle origin validation when env var is empty string', () => {
    process.env.NEXT_PUBLIC_APP_URL = '';

    const handler = jest.fn();
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    window.addEventListener(
      'message',
      createSecureMessageHandler(expectedOrigin, window.location.origin, handler)
    );

    const event = createMessageEvent(
      { type: 'test', payload: 'data' },
      window.location.origin
    );
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith({ type: 'test', payload: 'data' });
  });
});
