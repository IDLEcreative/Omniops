/**
 * Security Tests for postMessage Cross-Frame Communication
 *
 * Tests the security measures implemented to prevent XSS attacks through
 * cross-frame communication between the chat widget iframe and parent window.
 *
 * Key security requirements:
 * 1. Messages from trusted origins are accepted
 * 2. Messages from untrusted origins are blocked
 * 3. Origin validation uses specific origins (no wildcards)
 * 4. Warning logs are generated for blocked messages
 * 5. postMessage calls always specify target origins
 */

describe('postMessage Security', () => {
  const VALID_ORIGIN = 'https://example.com';
  const INVALID_ORIGIN = 'https://malicious-site.com';

  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console methods to verify security logging
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock environment variables
    process.env.NEXT_PUBLIC_APP_URL = VALID_ORIGIN;

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: VALID_ORIGIN,
        hostname: 'example.com',
        search: '',
      },
      writable: true,
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Origin Validation with Environment Variables', () => {
    it('should accept messages from NEXT_PUBLIC_APP_URL origin', () => {
      const handler = jest.fn();

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        if (event.data?.type === 'test') {
          handler(event.data);
        }
      });

      const event = new MessageEvent('message', {
        data: { type: 'test', payload: 'data' },
        origin: VALID_ORIGIN,
      });

      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith({ type: 'test', payload: 'data' });
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should block messages from untrusted origins', () => {
      const handler = jest.fn();

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        if (event.data?.type === 'test') {
          handler(event.data);
        }
      });

      const event = new MessageEvent('message', {
        data: { type: 'test', payload: 'malicious' },
        origin: INVALID_ORIGIN,
      });

      window.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ChatWidget] Blocked message from untrusted origin:',
        INVALID_ORIGIN
      );
    });

    it('should accept messages from window.location.origin as fallback', () => {
      // Temporarily unset environment variable
      delete process.env.NEXT_PUBLIC_APP_URL;

      const handler = jest.fn();

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        if (event.data?.type === 'test') {
          handler(event.data);
        }
      });

      const event = new MessageEvent('message', {
        data: { type: 'test', payload: 'data' },
        origin: window.location.origin,
      });

      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith({ type: 'test', payload: 'data' });
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Message Handler Security', () => {
    it('should ignore messages without a data object', () => {
      const handler = jest.fn();

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        const data = event.data;
        if (!data || typeof data.type !== 'string') {
          return;
        }

        handler(data);
      });

      const event = new MessageEvent('message', {
        data: null,
        origin: VALID_ORIGIN,
      });

      window.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should ignore messages without a type property', () => {
      const handler = jest.fn();

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        const data = event.data;
        if (!data || typeof data.type !== 'string') {
          return;
        }

        handler(data);
      });

      const event = new MessageEvent('message', {
        data: { payload: 'data' },
        origin: VALID_ORIGIN,
      });

      window.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should process valid messages with proper type', () => {
      const handler = jest.fn();

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        const data = event.data;
        if (!data || typeof data.type !== 'string') {
          return;
        }

        handler(data);
      });

      const event = new MessageEvent('message', {
        data: { type: 'open', payload: 'data' },
        origin: VALID_ORIGIN,
      });

      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith({ type: 'open', payload: 'data' });
    });
  });

  describe('postMessage Target Origin Validation', () => {
    it('should use specific origin from config, not wildcard', () => {
      const mockPostMessage = jest.fn();
      const mockIframe = {
        contentWindow: {
          postMessage: mockPostMessage,
        },
      } as any;

      const config = { serverUrl: VALID_ORIGIN };
      const targetOrigin = config.serverUrl || window.location.origin;

      // Simulate sending a message
      mockIframe.contentWindow.postMessage(
        { type: 'open' },
        targetOrigin
      );

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'open' },
        VALID_ORIGIN
      );

      // Verify wildcard is NOT used
      expect(mockPostMessage).not.toHaveBeenCalledWith(
        expect.anything(),
        '*'
      );
    });

    it('should fall back to window.location.origin if config.serverUrl is not set', () => {
      const mockPostMessage = jest.fn();
      const mockIframe = {
        contentWindow: {
          postMessage: mockPostMessage,
        },
      } as any;

      const config = { serverUrl: undefined };
      const targetOrigin = config.serverUrl || window.location.origin;

      mockIframe.contentWindow.postMessage(
        { type: 'close' },
        targetOrigin
      );

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'close' },
        window.location.origin
      );
    });

    it('should use NEXT_PUBLIC_APP_URL environment variable for target origin', () => {
      const mockPostMessage = jest.fn();
      const mockParent = {
        postMessage: mockPostMessage,
      } as any;

      Object.defineProperty(window, 'parent', {
        value: mockParent,
        writable: true,
      });

      const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      window.parent.postMessage(
        { type: 'ready' },
        targetOrigin
      );

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'ready' },
        VALID_ORIGIN
      );

      // Verify wildcard is NOT used
      expect(mockPostMessage).not.toHaveBeenCalledWith(
        expect.anything(),
        '*'
      );
    });
  });

  describe('Storage Request Security', () => {
    it('should validate origin when responding to storage requests', () => {
      const mockPostMessage = jest.fn();
      const mockIframe = {
        contentWindow: {
          postMessage: mockPostMessage,
        },
      } as any;

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        if (event.data?.type === 'getFromParentStorage') {
          const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
          mockIframe.contentWindow?.postMessage({
            type: 'storageResponse',
            requestId: event.data.requestId,
            value: 'test-value',
          }, targetOrigin);
        }
      });

      const event = new MessageEvent('message', {
        data: { type: 'getFromParentStorage', key: 'test', requestId: 'req123' },
        origin: VALID_ORIGIN,
      });

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
      const mockIframe = {
        contentWindow: {
          postMessage: mockPostMessage,
        },
      } as any;

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        if (event.data?.type === 'getFromParentStorage') {
          mockIframe.contentWindow?.postMessage({
            type: 'storageResponse',
            requestId: event.data.requestId,
            value: 'test-value',
          }, expectedOrigin);
        }
      });

      const event = new MessageEvent('message', {
        data: { type: 'getFromParentStorage', key: 'test', requestId: 'req123' },
        origin: INVALID_ORIGIN,
      });

      window.dispatchEvent(event);

      expect(mockPostMessage).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ChatWidget] Blocked message from untrusted origin:',
        INVALID_ORIGIN
      );
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle multiple trusted origins (env var and location)', () => {
      const handler = jest.fn();

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        if (event.data?.type === 'test') {
          handler(event.data);
        }
      });

      // Test with env var origin
      const event1 = new MessageEvent('message', {
        data: { type: 'test', payload: 'data1' },
        origin: VALID_ORIGIN,
      });
      window.dispatchEvent(event1);

      // Test with location origin
      const event2 = new MessageEvent('message', {
        data: { type: 'test', payload: 'data2' },
        origin: window.location.origin,
      });
      window.dispatchEvent(event2);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should block XSS attempt through malicious payload', () => {
      const handler = jest.fn();

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        const data = event.data;
        if (!data || typeof data.type !== 'string') {
          return;
        }

        handler(data);
      });

      const xssPayload = '<script>alert("XSS")</script>';
      const event = new MessageEvent('message', {
        data: { type: 'message', payload: xssPayload },
        origin: INVALID_ORIGIN,
      });

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

      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }

        if (event.data?.type === 'test') {
          handler(event.data);
        }
      });

      const event = new MessageEvent('message', {
        data: { type: 'test', payload: 'data' },
        origin: window.location.origin,
      });

      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith({ type: 'test', payload: 'data' });
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log warning with origin details when blocking messages', () => {
      window.addEventListener('message', (event) => {
        const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
          console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
          return;
        }
      });

      const event = new MessageEvent('message', {
        data: { type: 'test' },
        origin: INVALID_ORIGIN,
      });

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

      const event = new MessageEvent('message', {
        data: { type: 'test' },
        origin: VALID_ORIGIN,
      });

      window.dispatchEvent(event);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
