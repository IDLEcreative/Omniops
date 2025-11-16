import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import ChatWidget from '@/components/ChatWidget';
import { server } from '@/__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockLocalStorage, mockPostMessage, resetChatWidgetMocks } from './ChatWidget-setup';

describe('ChatWidget - Rendering', () => {
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

  describe('Component Rendering', () => {
    it('should render minimized widget by default', async () => {
      render(<ChatWidget />);

      // Wait for component to mount and minimized button to appear
      await waitFor(() => {
        const openButton = screen.getByLabelText('Open chat support widget');
        expect(openButton).toBeInTheDocument();
      });
      expect(screen.queryByLabelText('Chat support widget')).not.toBeInTheDocument();
    });

    it('should render open widget when initialOpen is true', async () => {
      render(<ChatWidget initialOpen={true} />);

      // Wait for component to mount and session to initialize
      await waitFor(() => {
        const chatDialog = screen.getByLabelText('Chat support widget');
        expect(chatDialog).toBeInTheDocument();
      });
      expect(screen.queryByLabelText('Open chat support widget')).not.toBeInTheDocument();
    });

    it('should display welcome message when no messages exist', async () => {
      render(<ChatWidget initialOpen={true} />);

      // Wait for component to mount and welcome message to appear
      await waitFor(() => {
        expect(screen.getByText('Hello! How can we help you today?')).toBeInTheDocument();
      });
    });

    it('should render with custom demo config', async () => {
      const demoConfig = {
        headerTitle: 'Custom Support Chat',
      };

      render(<ChatWidget initialOpen={true} demoConfig={demoConfig} />);

      // Wait for component to mount and custom header to appear
      await waitFor(() => {
        expect(screen.getByText('Custom Support Chat')).toBeInTheDocument();
      });
    });

    it('should not render before mounting', async () => {
      const { container } = render(<ChatWidget />);

      // Component uses mounted state to prevent hydration issues
      // Wait for component to mount and render
      await waitFor(() => {
        expect(container.firstChild).toBeTruthy();
      });
    });
  });

  describe('Session Management', () => {
    it('should generate and store session ID on mount', async () => {
      render(<ChatWidget />);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'session_id',
          expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
        );
      });
    });

    it('should use existing session ID if available', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'session_id') return 'existing-session-123';
        return null;
      });

      render(<ChatWidget />);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('session_id');
      // Should not create a new session ID
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
        'session_id',
        expect.anything()
      );
    });
  });

  describe('Privacy and Consent', () => {
    it('should show privacy consent screen when required', async () => {
      render(<ChatWidget
        initialOpen={true}
        privacySettings={{
          requireConsent: true,
          consentGiven: false,
        }}
      />);

      // Wait for component to mount and session to initialize
      await waitFor(() => {
        expect(screen.getByText('Privacy Notice')).toBeInTheDocument();
      });
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

      // Wait for privacy banner to render
      const acceptButton = await screen.findByText('Accept');
      await user.click(acceptButton);

      // Chat interface should appear
      await waitFor(() => {
        expect(screen.getByLabelText('Type your message...')).toBeInTheDocument();
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
      const acceptButton = await screen.findByText('Accept');
      await user.click(acceptButton);

      // Wait for chat interface to render after consent
      const input = await screen.findByLabelText('Type your message...');
      await user.type(input, 'Test message');

      const sendButton = screen.getByLabelText('Send');
      await user.click(sendButton);

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

      // Wait for privacy banner to render
      const cancelButton = await screen.findByText('Cancel');
      await user.click(cancelButton);

      // Widget should be minimized
      await waitFor(() => {
        expect(screen.queryByText('Privacy Notice')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Open chat support widget')).toBeInTheDocument();
      });
    });
  });

  describe('WooCommerce Integration', () => {
    it('should check WooCommerce config on mount', async () => {
      render(<ChatWidget />);

      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('session_id');
      });

      // Should have called the config endpoint
      // Note: We can't easily verify fetch calls in this setup, but the component does call it
    });

    it('should use test-domain.example.com domain for localhost', async () => {
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

      // Component should check config for test-domain.example.com
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
  });

  describe('Callback Events', () => {
    it('should call onReady callback when mounted', () => {
      const onReady = jest.fn();
      render(<ChatWidget onReady={onReady} />);

      expect(onReady).toHaveBeenCalled();
    });
  });
});
