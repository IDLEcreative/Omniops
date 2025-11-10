/**
 * PostMessage Target Origin Validation Tests
 *
 * Tests that postMessage calls always specify target origins
 * (never wildcards) and properly fallback to default origins.
 */

import {
  VALID_ORIGIN,
  createMockIframe,
  createMockParent,
  mockWindowLocation,
  getTargetOrigin,
} from '../../utils/security/postmessage-helpers';

describe('postMessage Security - Target Origin Validation', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = VALID_ORIGIN;
    mockWindowLocation(VALID_ORIGIN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should use specific origin from config, not wildcard', () => {
    const mockPostMessage = jest.fn();
    const mockIframe = {
      contentWindow: {
        postMessage: mockPostMessage,
      },
    } as any;

    const config = { serverUrl: VALID_ORIGIN };
    const targetOrigin = getTargetOrigin(config.serverUrl, window.location.origin);

    mockIframe.contentWindow.postMessage({ type: 'open' }, targetOrigin);

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'open' }, VALID_ORIGIN);
    expect(mockPostMessage).not.toHaveBeenCalledWith(
      expect.anything(),
      '*'
    );
  });

  it('should fall back to window.location.origin if config.serverUrl is not set', () => {
    const mockPostMessage = jest.fn();
    const mockIframe = createMockIframe();
    mockIframe.contentWindow.postMessage = mockPostMessage;

    const config = { serverUrl: undefined };
    const targetOrigin = getTargetOrigin(config.serverUrl, window.location.origin);

    mockIframe.contentWindow.postMessage({ type: 'close' }, targetOrigin);

    expect(mockPostMessage).toHaveBeenCalledWith(
      { type: 'close' },
      window.location.origin
    );
  });

  it('should use NEXT_PUBLIC_APP_URL environment variable for target origin', () => {
    const mockPostMessage = jest.fn();
    const mockParent = createMockParent();
    mockParent.postMessage = mockPostMessage;

    Object.defineProperty(window, 'parent', {
      value: mockParent,
      writable: true,
    });

    const targetOrigin = getTargetOrigin(
      process.env.NEXT_PUBLIC_APP_URL,
      window.location.origin
    );

    window.parent.postMessage({ type: 'ready' }, targetOrigin);

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'ready' }, VALID_ORIGIN);
    expect(mockPostMessage).not.toHaveBeenCalledWith(
      expect.anything(),
      '*'
    );
  });
});
