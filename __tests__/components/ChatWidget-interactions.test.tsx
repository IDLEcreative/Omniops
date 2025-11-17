import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import ChatWidget from '@/components/ChatWidget';
import { server } from '@/__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockLocalStorage, resetChatWidgetMocks } from './ChatWidget-setup';

describe('ChatWidget - Interactions', () => {
  beforeEach(() => {
    resetChatWidgetMocks();
    server.resetHandlers();

    // Mock API handlers
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

        if (domain === 'test-domain.example.com' || domain === 'localhost') {
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

  describe('Widget Open/Close', () => {
    it('should toggle widget open/closed', async () => {
      const { user } = render(<ChatWidget />);

      const openButton = await waitFor(() => screen.getByLabelText('Open chat support widget'));
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

      const openButton = await waitFor(() => screen.getByLabelText('Open chat support widget'));
      await user.click(openButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('widget_open', 'true');
      });

      const closeButton = screen.getByLabelText('Close chat widget');
      await user.click(closeButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('widget_open', 'false');
      });
    });
  });

  describe('Textarea Auto-resize', () => {
    it('should auto-resize textarea as user types', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const textarea = await waitFor(() => screen.getByLabelText('Type your message...')) as HTMLTextAreaElement;

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

      const textarea = await waitFor(() => screen.getByLabelText('Type your message...')) as HTMLTextAreaElement;

      await user.type(textarea, 'Line 1\nLine 2\nLine 3');
      await user.click(screen.getByLabelText('Send'));

      // Wait for reset
      await waitFor(() => {
        expect(textarea.style.height).toBe('40px');
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should toggle high contrast mode', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const contrastButton = await waitFor(() => screen.getByLabelText(/Toggle high contrast mode/));
      await user.click(contrastButton);

      // Check that aria-label updates
      expect(contrastButton).toHaveAttribute('aria-label', expect.stringContaining('Currently on'));
    });

    it('should cycle through font sizes', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const fontSizeButton = await waitFor(() => screen.getByLabelText(/Change text size/));

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

  describe('Input Handling', () => {
    it('should prevent sending empty messages', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const sendButton = await waitFor(() => screen.getByLabelText('Send'));

      // Try to send without typing anything
      expect(sendButton).toBeDisabled();

      // Try with whitespace only
      const input = screen.getByLabelText('Type your message...');
      await user.type(input, '   ');

      expect(sendButton).toBeDisabled();
    });

    it('should disable send button when input is empty', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      const sendButton = screen.getByLabelText('Send');

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

    it('should handle special characters in messages', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const specialMessage = 'Test <script>alert("xss")</script> & "quotes"';
      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      await user.type(input, specialMessage);
      await user.click(screen.getByLabelText('Send'));

      await waitFor(() => {
        expect(screen.getByText(specialMessage)).toBeInTheDocument();
      });
    });

    it('should handle very long messages', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      const longMessage = 'A'.repeat(1000);
      const input = await waitFor(() => screen.getByLabelText('Type your message...'));

      // Use paste instead of type for long messages to avoid timeout
      await user.click(input);
      await user.paste(longMessage);
      await user.click(screen.getByLabelText('Send'));

      await waitFor(() => {
        expect(screen.getByText(longMessage)).toBeInTheDocument();
      });
    });
  });
});
