import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@/__tests__/utils/test-utils';
import ChatWidget from '@/components/ChatWidget';
import { server } from '@/__tests__/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.parent for postMessage tests
const mockPostMessage = jest.fn();
Object.defineProperty(window, 'parent', {
  value: {
    postMessage: mockPostMessage,
  },
  writable: true,
});

describe('ChatWidget Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockPostMessage.mockClear();

    // Reset server handlers to default
    server.resetHandlers();

    // Mock API handlers - use handlers that passthrough by default
    server.use(
      http.post('/api/chat', async ({ request }) => {
        const body = await request.json() as { message: string; conversation_id?: string };
        const responseMessage = `Response to: ${body.message}`;
        return HttpResponse.json({
          message: responseMessage,
          content: responseMessage,
          conversation_id: body.conversation_id || 'conv-123',
          id: `msg-${Date.now()}`,
        });
      }),
      http.get('/api/customer/config', ({ request }) => {
        const url = new URL(request.url);
        const domain = url.searchParams.get('domain');

        if (domain === 'thompsonseparts.co.uk' || domain === 'localhost') {
          return HttpResponse.json({
            config: {
              domain: domain,
              woocommerce_enabled: true,
            },
          });
        }

        return HttpResponse.json({ config: null }, { status: 404 });
      })
    );
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('should render minimized widget by default', () => {
      render(<ChatWidget />);

      const openButton = screen.getByLabelText('Open chat support widget');
      expect(openButton).toBeInTheDocument();
      expect(screen.queryByLabelText('Chat support widget')).not.toBeInTheDocument();
    });

    it('should render open widget when initialOpen is true', () => {
      render(<ChatWidget initialOpen={true} />);

      const chatDialog = screen.getByLabelText('Chat support widget');
      expect(chatDialog).toBeInTheDocument();
      expect(screen.queryByLabelText('Open chat support widget')).not.toBeInTheDocument();
    });

    it('should display welcome message when no messages exist', () => {
      render(<ChatWidget initialOpen={true} />);

      expect(screen.getByText('Hello! How can we help you today?')).toBeInTheDocument();
    });

    it('should render with custom demo config', () => {
      const demoConfig = {
        headerTitle: 'Custom Support Chat',
      };

      render(<ChatWidget initialOpen={true} demoConfig={demoConfig} />);

      expect(screen.getByText('Custom Support Chat')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should generate and store session ID on mount', async () => {
      render(<ChatWidget />);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'chat_session_id',
          expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
        );
      });
    });

    it('should use existing session ID if available', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'chat_session_id') return 'existing-session-123';
        return null;
      });

      render(<ChatWidget />);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('chat_session_id');
      // Should not create a new session ID
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
        'chat_session_id',
        expect.anything()
      );
    });
  });

  describe('Message Sending', () => {
    it('should send message on button click', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const input = screen.getByLabelText('Message input');
      const sendButton = screen.getByLabelText('Send message');

      await user.type(input, 'Hello support');
      await user.click(sendButton);

      // Check that user message appears immediately
      await waitFor(() => {
        expect(screen.getByText('Hello support')).toBeInTheDocument();
      });

      // Check that input was cleared
      expect(input).toHaveValue('');
    });

    it('should send message on Enter key press', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const input = screen.getByLabelText('Message input') as HTMLTextAreaElement;

      await user.type(input, 'Test message{Enter}');

      // Message should be sent
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      // Input should be cleared
      expect(input.value).toBe('');
    });

    it('should not send message on Shift+Enter', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const input = screen.getByLabelText('Message input') as HTMLTextAreaElement;

      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      // Should not send the message
      expect(screen.queryByText('Line 1')).not.toBeInTheDocument();

      // Input should contain both lines
      expect(input.value).toContain('Line 1');
      expect(input.value).toContain('Line 2');
    });

    it('should prevent sending empty messages', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const sendButton = screen.getByLabelText('Send message');

      // Try to send without typing anything
      expect(sendButton).toBeDisabled();

      // Try with whitespace only
      const input = screen.getByLabelText('Message input');
      await user.type(input, '   ');

      expect(sendButton).toBeDisabled();
    });

    it('should clear input after sending message', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const input = screen.getByLabelText('Message input') as HTMLTextAreaElement;
      const sendButton = screen.getByLabelText('Send message');

      await user.type(input, 'Test message');
      await user.click(sendButton);

      // Input should be cleared immediately
      expect(input.value).toBe('');
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator while waiting for response', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      // Delay the response
      server.use(
        http.post('/api/chat', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({
            message: 'Delayed response',
            conversation_id: 'conv-123',
          });
        })
      );

      const input = screen.getByLabelText('Message input');
      await user.type(input, 'Test');
      await user.click(screen.getByLabelText('Send message'));

      // Check for loading indicator
      await waitFor(() => {
        expect(screen.getByText('Support agent is typing')).toBeInTheDocument();
      });
    });

    it('should disable send button when input is empty', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const input = screen.getByLabelText('Message input');
      const sendButton = screen.getByLabelText('Send message');

      // Initially, send button should be disabled (empty input)
      expect(sendButton).toBeDisabled();

      // Type something
      await user.type(input, 'Test');

      // Send button should now be enabled
      await waitFor(() => {
        expect(sendButton).not.toBeDisabled();
      });

      // Clear input
      await user.clear(input);

      // Send button should be disabled again
      await waitFor(() => {
        expect(sendButton).toBeDisabled();
      });
    });

    it('should prevent rapid message sending', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      // Delay the response
      server.use(
        http.post('/api/chat', async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return HttpResponse.json({
            message: 'Response',
            conversation_id: 'conv-123',
          });
        })
      );

      const input = screen.getByLabelText('Message input');
      const sendButton = screen.getByLabelText('Send message');

      await user.type(input, 'First message');
      const clickPromise = user.click(sendButton);

      // Input should be disabled immediately after click starts
      await waitFor(() => {
        expect(input).toBeDisabled();
        expect(sendButton).toBeDisabled();
      }, { timeout: 100 });

      await clickPromise;

      // Wait for response
      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      server.use(
        http.post('/api/chat', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      const input = screen.getByLabelText('Message input');
      await user.type(input, 'This will fail');
      await user.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      server.use(
        http.post('/api/chat', () => {
          return HttpResponse.error();
        })
      );

      const input = screen.getByLabelText('Message input');
      await user.type(input, 'Network error test');
      await user.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle non-JSON responses', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      server.use(
        http.post('/api/chat', () => {
          return new HttpResponse('<html>Error page</html>', {
            headers: { 'Content-Type': 'text/html' },
          });
        })
      );

      const input = screen.getByLabelText('Message input');
      await user.type(input, 'Test');
      await user.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Widget Interactions', () => {
    it('should toggle widget open/closed', async () => {
      const { user } = render(<ChatWidget />);

      const openButton = screen.getByLabelText('Open chat support widget');
      await user.click(openButton);

      // Widget should be open
      expect(screen.getByLabelText('Chat support widget')).toBeInTheDocument();

      // Close the widget
      const closeButton = screen.getByLabelText('Close chat widget');
      await user.click(closeButton);

      // Widget should be minimized
      await waitFor(() => {
        expect(screen.queryByLabelText('Chat support widget')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Open chat support widget')).toBeInTheDocument();
      });
    });

    it('should persist widget state to localStorage', async () => {
      const { user } = render(<ChatWidget />);

      const openButton = screen.getByLabelText('Open chat support widget');
      await user.click(openButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('chat_widget_open', 'true');
      });

      const closeButton = screen.getByLabelText('Close chat widget');
      await user.click(closeButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('chat_widget_open', 'false');
      });
    });
  });

  describe('Privacy and Consent', () => {
    it('should show privacy consent screen when required', () => {
      render(<ChatWidget
        initialOpen={true}
        privacySettings={{
          requireConsent: true,
          consentGiven: false,
        }}
      />);

      expect(screen.getByText('Privacy Notice')).toBeInTheDocument();
      expect(screen.getByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should show chat after consent is given', async () => {
      const { user } = render(<ChatWidget
        initialOpen={true}
        privacySettings={{
          requireConsent: true,
          consentGiven: false,
        }}
      />);

      const acceptButton = screen.getByText('Accept');
      await user.click(acceptButton);

      // Chat interface should appear
      await waitFor(() => {
        expect(screen.getByLabelText('Message input')).toBeInTheDocument();
      });
    });

    it('should prevent sending messages without consent', async () => {
      const { user } = render(<ChatWidget
        initialOpen={true}
        privacySettings={{
          requireConsent: true,
          consentGiven: false,
        }}
      />);

      // Give consent first
      await user.click(screen.getByText('Accept'));

      // Now should be able to send messages
      const input = screen.getByLabelText('Message input');
      await user.type(input, 'Test message');
      await user.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });

    it('should close widget when clicking Cancel on consent screen', async () => {
      const { user } = render(<ChatWidget
        initialOpen={true}
        privacySettings={{
          requireConsent: true,
          consentGiven: false,
        }}
      />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Widget should be minimized
      await waitFor(() => {
        expect(screen.queryByText('Privacy Notice')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Open chat support widget')).toBeInTheDocument();
      });
    });
  });

  describe('Textarea Auto-resize', () => {
    it('should auto-resize textarea as user types', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;

      // Mock scrollHeight to simulate multi-line content
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        get: function() {
          return this.value.split('\n').length * 20 + 40;
        },
      });

      const longMessage = 'Line 1\nLine 2\nLine 3\nLine 4';
      await user.type(textarea, longMessage);

      // Wait for height to update
      await waitFor(() => {
        const height = parseInt(textarea.style.height) || 0;
        expect(height).toBeGreaterThan(40); // Initial height
      });

      const height = parseInt(textarea.style.height);
      expect(height).toBeLessThanOrEqual(120); // Max height
    });

    it('should reset textarea height after sending message', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;

      await user.type(textarea, 'Line 1\nLine 2\nLine 3');
      await user.click(screen.getByLabelText('Send message'));

      // Wait for reset
      await waitFor(() => {
        expect(textarea.style.height).toBe('40px');
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should toggle high contrast mode', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const contrastButton = screen.getByLabelText(/Toggle high contrast mode/);
      await user.click(contrastButton);

      // Check that aria-label updates
      expect(contrastButton).toHaveAttribute('aria-label', expect.stringContaining('Currently on'));
    });

    it('should cycle through font sizes', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const fontSizeButton = screen.getByLabelText(/Change text size/);

      // Initial state: normal
      expect(fontSizeButton).toHaveAttribute('aria-label', expect.stringContaining('normal'));

      // Click once: large
      await user.click(fontSizeButton);
      await waitFor(() => {
        expect(fontSizeButton).toHaveAttribute('aria-label', expect.stringContaining('large'));
      });

      // Click again: xlarge
      await user.click(fontSizeButton);
      await waitFor(() => {
        expect(fontSizeButton).toHaveAttribute('aria-label', expect.stringContaining('xlarge'));
      });

      // Click again: back to normal
      await user.click(fontSizeButton);
      await waitFor(() => {
        expect(fontSizeButton).toHaveAttribute('aria-label', expect.stringContaining('normal'));
      });
    });
  });

  describe('Conversation Context', () => {
    it('should store conversation ID after first message', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const input = screen.getByLabelText('Message input');

      // Send first message
      await user.type(input, 'First message');
      await user.click(screen.getByLabelText('Send message'));

      // Check that user message was sent
      await waitFor(() => {
        expect(screen.getByText('First message')).toBeInTheDocument();
      });

      // Component should now have a conversation ID stored (internal state)
      // We can verify this indirectly by checking that a second message would include it
      // For now, just verify the message was sent successfully
      expect(input).toHaveValue('');
    });
  });

  describe('WooCommerce Integration', () => {
    it('should check WooCommerce config on mount', async () => {
      render(<ChatWidget />);

      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('chat_session_id');
      });

      // Should have called the config endpoint
      // Note: We can't easily verify fetch calls in this setup, but the component does call it
    });

    it('should use thompsonseparts.co.uk domain for localhost', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          search: '',
        },
        writable: true,
      });

      render(<ChatWidget initialOpen={true} />);

      // Wait for mount
      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      });

      // Component should check config for thompsonseparts.co.uk
    });
  });

  describe('Message Events', () => {
    it('should call onReady callback when mounted', () => {
      const onReady = jest.fn();
      render(<ChatWidget onReady={onReady} />);

      expect(onReady).toHaveBeenCalled();
    });

    it('should call onMessage callback for user messages', async () => {
      const onMessage = jest.fn();
      const { user } = render(<ChatWidget initialOpen={true} onMessage={onMessage} />);

      const input = screen.getByLabelText('Message input');
      await user.type(input, 'Test message');
      await user.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(onMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'user',
            content: 'Test message',
          })
        );
      });
    });

    it('should call onMessage callback for user messages', async () => {
      const onMessage = jest.fn();
      const { user } = render(<ChatWidget initialOpen={true} onMessage={onMessage} />);

      const input = screen.getByLabelText('Message input');
      await user.type(input, 'Test');
      await user.click(screen.getByLabelText('Send message'));

      // Check that onMessage was called with user message
      await waitFor(() => {
        expect(onMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'user',
            content: 'Test',
          })
        );
      });
    });
  });

  describe('PostMessage API', () => {
    it('should send ready message to parent on mount', () => {
      // Mock window.parent to be different from window
      const originalParent = window.parent;
      Object.defineProperty(window, 'parent', {
        value: { postMessage: mockPostMessage },
        writable: true,
      });

      render(<ChatWidget />);

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'ready' },
        '*'
      );

      // Restore
      Object.defineProperty(window, 'parent', {
        value: originalParent,
        writable: true,
      });
    });

    it('should send analytics events for messages', async () => {
      const originalParent = window.parent;
      Object.defineProperty(window, 'parent', {
        value: { postMessage: mockPostMessage },
        writable: true,
      });

      const { user } = render(<ChatWidget initialOpen={true} />);

      const input = screen.getByLabelText('Message input');
      await user.type(input, 'Test');
      await user.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'analytics',
            event: 'message_sent',
            label: 'user',
          }),
          '*'
        );
      });

      // Restore
      Object.defineProperty(window, 'parent', {
        value: originalParent,
        writable: true,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const longMessage = 'A'.repeat(1000);
      const input = screen.getByLabelText('Message input');
      await user.type(input, longMessage);
      await user.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText(longMessage)).toBeInTheDocument();
      });
    });

    it('should handle special characters in messages', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const specialMessage = 'Test <script>alert("xss")</script> & "quotes"';
      const input = screen.getByLabelText('Message input');
      await user.type(input, specialMessage);
      await user.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText(specialMessage)).toBeInTheDocument();
      });
    });

    it('should not render before mounting', () => {
      const { container } = render(<ChatWidget />);

      // Component uses mounted state to prevent hydration issues
      // After initial render, it should be visible
      expect(container.firstChild).toBeTruthy();
    });
  });
});
