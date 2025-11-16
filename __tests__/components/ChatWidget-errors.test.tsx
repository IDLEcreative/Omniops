import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import ChatWidget from '@/components/ChatWidget';
import { server } from '@/__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import { resetChatWidgetMocks } from './ChatWidget-setup';

describe('ChatWidget - Error Handling', () => {
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

  describe('API Error Handling', () => {
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

      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      await user.type(input, 'This will fail');
      await user.click(screen.getByLabelText('Send'));

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

      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      await user.type(input, 'Network error test');
      await user.click(screen.getByLabelText('Send'));

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

      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      await user.type(input, 'Test');
      await user.click(screen.getByLabelText('Send'));

      await waitFor(() => {
        expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('HTTP Status Error Handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      server.use(
        http.post('/api/chat', () => {
          return HttpResponse.json(
            { error: 'Bad request' },
            { status: 400 }
          );
        })
      );

      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      await user.type(input, 'Test');
      await user.click(screen.getByLabelText('Send'));

      await waitFor(() => {
        expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle 404 Not Found errors', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      server.use(
        http.post('/api/chat', () => {
          return HttpResponse.json(
            { error: 'Not found' },
            { status: 404 }
          );
        })
      );

      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      await user.type(input, 'Test');
      await user.click(screen.getByLabelText('Send'));

      await waitFor(() => {
        expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle 503 Service Unavailable errors', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      server.use(
        http.post('/api/chat', () => {
          return HttpResponse.json(
            { error: 'Service unavailable' },
            { status: 503 }
          );
        })
      );

      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      await user.type(input, 'Test');
      await user.click(screen.getByLabelText('Send'));

      await waitFor(() => {
        expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Response Format Error Handling', () => {
    it('should handle malformed JSON responses', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      server.use(
        http.post('/api/chat', () => {
          return new HttpResponse('{ invalid json }', {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      await user.type(input, 'Test');
      await user.click(screen.getByLabelText('Send'));

      await waitFor(() => {
        expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle empty responses', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      server.use(
        http.post('/api/chat', () => {
          return new HttpResponse('', {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      await user.type(input, 'Test');
      await user.click(screen.getByLabelText('Send'));

      await waitFor(() => {
        expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after error', async () => {
      const { user } = render(<ChatWidget initialOpen={true} />);

      // First request fails
      server.use(
        http.post('/api/chat', () => {
          return HttpResponse.json(
            { error: 'Server error' },
            { status: 500 }
          );
        })
      );

      const input = await waitFor(() => screen.getByLabelText('Type your message...'));
      await user.type(input, 'First attempt');
      await user.click(screen.getByLabelText('Send'));

      await waitFor(() => {
        expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });

      // Reset handler to succeed
      server.use(
        http.post('/api/chat', async ({ request }) => {
          const body = await request.json() as { message: string };
          return HttpResponse.json({
            message: `Response to: ${body.message}`,
            conversation_id: 'conv-123',
          });
        })
      );

      // Second attempt should succeed
      await user.type(input, 'Second attempt');
      await user.click(screen.getByLabelText('Send'));

      await waitFor(() => {
        expect(screen.getByText('Second attempt')).toBeInTheDocument();
      });
    });
  });
});
