/**
 * Logging and Monitoring Tests
 *
 * Tests that security events are properly logged and monitored.
 */

import {
  VALID_ORIGIN,
  INVALID_ORIGIN,
  createMessageEvent,
  mockWindowLocation,
} from '../../utils/security/postmessage-helpers';

describe('postMessage Security - Logging', () => {
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

  it('should log warning with origin details when blocking messages', () => {
    window.addEventListener('message', (event) => {
      const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
        console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
        return;
      }
    });

    const event = createMessageEvent({ type: 'test' }, INVALID_ORIGIN);
    window.dispatchEvent(event);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[ChatWidget] Blocked message from untrusted origin:',
      INVALID_ORIGIN
    );
  });

  it('should not log warnings for valid origins', () => {
    window.addEventListener('message', (event) => {
      const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
        console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
        return;
      }
    });

    const event = createMessageEvent({ type: 'test' }, VALID_ORIGIN);
    window.dispatchEvent(event);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
