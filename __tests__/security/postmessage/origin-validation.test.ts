/**
 * Origin Validation Tests
 *
 * Tests that messages from trusted origins are accepted and
 * messages from untrusted origins are blocked.
 */

import {
  VALID_ORIGIN,
  INVALID_ORIGIN,
  createMessageEvent,
  mockWindowLocation,
  createSecureMessageHandler,
} from '../../utils/security/postmessage-helpers';

describe('postMessage Security - Origin Validation', () => {
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

  it('should accept messages from NEXT_PUBLIC_APP_URL origin', () => {
    const handler = jest.fn();
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    window.addEventListener(
      'message',
      createSecureMessageHandler(expectedOrigin, window.location.origin, handler)
    );

    const event = createMessageEvent(
      { type: 'test', payload: 'data' },
      VALID_ORIGIN
    );
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith({ type: 'test', payload: 'data' });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should block messages from untrusted origins', () => {
    const handler = jest.fn();
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    window.addEventListener(
      'message',
      createSecureMessageHandler(expectedOrigin, window.location.origin, handler)
    );

    const event = createMessageEvent(
      { type: 'test', payload: 'malicious' },
      INVALID_ORIGIN
    );
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[ChatWidget] Blocked message from untrusted origin:',
      INVALID_ORIGIN
    );
  });

  it('should accept messages from window.location.origin as fallback', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;

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
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
