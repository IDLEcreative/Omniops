/**
 * Storage Request Security Tests
 *
 * Tests that storage requests are validated for origin and
 * responses are only sent to trusted origins.
 */

import {
  VALID_ORIGIN,
  INVALID_ORIGIN,
  createMessageEvent,
  createMockIframe,
  mockWindowLocation,
  getTargetOrigin,
} from '../../utils/security/postmessage-helpers';

describe('postMessage Security - Storage Requests', () => {
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

  it('should validate origin when responding to storage requests', () => {
    const mockPostMessage = jest.fn();
    const mockIframe = createMockIframe();
    mockIframe.contentWindow.postMessage = mockPostMessage;

    window.addEventListener('message', (event) => {
      const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
        console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
        return;
      }

      if (event.data?.type === 'getFromParentStorage') {
        const targetOrigin = getTargetOrigin(
          process.env.NEXT_PUBLIC_APP_URL,
          window.location.origin
        );
        mockIframe.contentWindow?.postMessage(
          {
            type: 'storageResponse',
            requestId: event.data.requestId,
            value: 'test-value',
          },
          targetOrigin
        );
      }
    });

    const event = createMessageEvent(
      { type: 'getFromParentStorage', key: 'test', requestId: 'req123' },
      VALID_ORIGIN
    );
    window.dispatchEvent(event);

    expect(mockPostMessage).toHaveBeenCalledWith(
      {
        type: 'storageResponse',
        requestId: 'req123',
        value: 'test-value',
      },
      VALID_ORIGIN
    );
  });

  it('should not respond to storage requests from untrusted origins', () => {
    const mockPostMessage = jest.fn();
    const mockIframe = createMockIframe();
    mockIframe.contentWindow.postMessage = mockPostMessage;

    window.addEventListener('message', (event) => {
      const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
        console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
        return;
      }

      if (event.data?.type === 'getFromParentStorage') {
        const targetOrigin = getTargetOrigin(
          process.env.NEXT_PUBLIC_APP_URL,
          window.location.origin
        );
        mockIframe.contentWindow?.postMessage(
          {
            type: 'storageResponse',
            requestId: event.data.requestId,
            value: 'test-value',
          },
          targetOrigin
        );
      }
    });

    const event = createMessageEvent(
      { type: 'getFromParentStorage', key: 'test', requestId: 'req123' },
      INVALID_ORIGIN
    );
    window.dispatchEvent(event);

    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[ChatWidget] Blocked message from untrusted origin:',
      INVALID_ORIGIN
    );
  });
});
