/**
 * Message Handler Security Tests
 *
 * Tests that message handlers properly validate message structure
 * and reject malformed messages.
 */

import {
  VALID_ORIGIN,
  createMessageEvent,
  mockWindowLocation,
  createSecureMessageHandler,
} from '../../utils/security/postmessage-helpers';

describe('postMessage Security - Message Handler', () => {
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

  it('should ignore messages without a data object', () => {
    const handler = jest.fn();
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    window.addEventListener(
      'message',
      createSecureMessageHandler(expectedOrigin, window.location.origin, handler)
    );

    const event = createMessageEvent(null, VALID_ORIGIN);
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should ignore messages without a type property', () => {
    const handler = jest.fn();
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    window.addEventListener(
      'message',
      createSecureMessageHandler(expectedOrigin, window.location.origin, handler)
    );

    const event = createMessageEvent({ payload: 'data' }, VALID_ORIGIN);
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should process valid messages with proper type', () => {
    const handler = jest.fn();
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    window.addEventListener(
      'message',
      createSecureMessageHandler(expectedOrigin, window.location.origin, handler)
    );

    const event = createMessageEvent(
      { type: 'open', payload: 'data' },
      VALID_ORIGIN
    );
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith({ type: 'open', payload: 'data' });
  });
});
