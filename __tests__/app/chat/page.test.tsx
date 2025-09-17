import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import ChatPage from '@/app/chat/page'
import { server } from '@/__tests__/mocks/server'
import { http, HttpResponse } from 'msw'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn()

describe('Chat Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should render chat interface', () => {
    render(<ChatPage />)

    expect(screen.getByText('Customer Service Assistant')).toBeInTheDocument()
    expect(screen.getByText('How can I help you today?')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should generate and store session ID on mount', () => {
    render(<ChatPage />)

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('chat_session_id')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'chat_session_id',
      expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
    )
  })

  it('should use existing session ID if available', () => {
    mockLocalStorage.getItem.mockReturnValue('existing_session_123')

    render(<ChatPage />)

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('chat_session_id')
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('should send a message when form is submitted', async () => {
    const { user } = render(<ChatPage />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    // Type a message
    await user.type(input, 'Hello, I need help')

    // Submit the form
    await user.click(sendButton)

    // Check that user message appears
    expect(screen.getByText('Hello, I need help')).toBeInTheDocument()

    // Wait for assistant response
    await waitFor(() => {
      expect(screen.getByText('This is a helpful response from the AI assistant.')).toBeInTheDocument()
    })

    // Input should be cleared
    expect(input).toHaveValue('')
  })

  it('should disable input and button while loading', async () => {
    const { user } = render(<ChatPage />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    // Type and send a message
    await user.type(input, 'Test message')
    await user.click(sendButton)

    // Check loading state
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()

    // Wait for response
    await waitFor(() => {
      expect(input).not.toBeDisabled()
      expect(sendButton).not.toBeDisabled()
    })
  })

  it('should show loading indicator while waiting for response', async () => {
    const { user } = render(<ChatPage />)

    // Delay the response
    server.use(
      http.post('/api/chat', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.json({
          message: 'Delayed response',
          conversation_id: 'conv-123',
        })
      })
    )

    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Test')
    await user.click(screen.getByRole('button'))

    // Check for loading animation (the bouncing dots)
    const loadingDots = screen.getAllByRole('presentation').filter(el => 
      el.classList.contains('animate-bounce')
    )
    expect(loadingDots.length).toBeGreaterThan(0)

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Delayed response')).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    const { user } = render(<ChatPage />)

    // Mock API error
    server.use(
      http.post('/api/chat', () => {
        return HttpResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      })
    )

    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'This will fail')
    await user.click(screen.getByRole('button'))

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument()
    })
  })

  it('should handle network errors', async () => {
    const { user } = render(<ChatPage />)

    // Mock network error
    server.use(
      http.post('/api/chat', () => {
        return HttpResponse.error()
      })
    )

    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Network error test')
    await user.click(screen.getByRole('button'))

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument()
    })
  })

  it('should display message sources when available', async () => {
    const { user } = render(<ChatPage />)

    // Mock response with sources
    server.use(
      http.post('/api/chat', () => {
        return HttpResponse.json({
          message: 'Here is information from our website.',
          conversation_id: 'conv-123',
          sources: [
            { url: 'https://example.com/page1', title: 'Page 1', relevance: 0.9 },
            { url: 'https://example.com/page2', title: 'Page 2', relevance: 0.8 },
          ],
        })
      })
    )

    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Tell me about your products')
    await user.click(screen.getByRole('button'))

    // Wait for response with sources
    await waitFor(() => {
      expect(screen.getByText('Source 1')).toBeInTheDocument()
      expect(screen.getByText('Source 2')).toBeInTheDocument()
    })
  })

  it('should maintain conversation context', async () => {
    const { user } = render(<ChatPage />)

    let requestCount = 0
    let capturedConversationId: string | undefined

    // Mock API to track conversation ID
    server.use(
      http.post('/api/chat', async ({ request }) => {
        const body = await request.json() as { conversation_id?: string; message: string }
        requestCount++

        if (requestCount === 1) {
          expect(body.conversation_id).toBeUndefined()
          return HttpResponse.json({
            message: 'First response',
            conversation_id: 'new-conv-123',
          })
        } else {
          capturedConversationId = body.conversation_id
          expect(body.conversation_id).toBe('new-conv-123')
          return HttpResponse.json({
            message: 'Second response',
            conversation_id: 'new-conv-123',
          })
        }
      })
    )

    // Send first message
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'First message')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('First response')).toBeInTheDocument()
    })

    // Send second message
    await user.type(input, 'Second message')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Second response')).toBeInTheDocument()
    })

    expect(capturedConversationId).toBe('new-conv-123')
  })

  it('should prevent sending empty messages', async () => {
    const { user } = render(<ChatPage />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    // Try to send empty message
    await user.click(sendButton)

    // Should not make API call
    expect(screen.queryByText('Hello, I need help')).not.toBeInTheDocument()

    // Try with whitespace only
    await user.type(input, '   ')
    expect(sendButton).toBeDisabled()
  })

  it('should handle Enter key to send message', async () => {
    const { user } = render(<ChatPage />)

    const input = screen.getByPlaceholderText('Type your message...')

    // Type and press Enter
    await user.type(input, 'Message via Enter{Enter}')

    // Check that message was sent
    await waitFor(() => {
      expect(screen.getByText('Message via Enter')).toBeInTheDocument()
    })
  })

  it('should auto-scroll to latest message', async () => {
    const { user } = render(<ChatPage />)

    const input = screen.getByPlaceholderText('Type your message...')

    // Send multiple messages
    for (let i = 1; i <= 3; i++) {
      await user.type(input, `Message ${i}`)
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText(`Message ${i}`)).toBeInTheDocument()
      })
    }

    // Check that scrollIntoView was called
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('should display user and agent avatars correctly', async () => {
    const { user } = render(<ChatPage />)

    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Test message')
    await user.click(screen.getByRole('button'))

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('This is a helpful response from the AI assistant.')).toBeInTheDocument()
    })

    // Check that avatars are displayed
    const avatars = screen.getAllByRole('img', { hidden: true })
    expect(avatars.length).toBeGreaterThanOrEqual(2) // At least one user and one agent avatar
  })

  it('should handle rapid message sending', async () => {
    const { user } = render(<ChatPage />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    // Type first message
    await user.type(input, 'First message')
    await user.click(sendButton)

    // Try to send another message immediately (should be disabled)
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()

    // Wait for first response
    await waitFor(() => {
      expect(screen.getByText('This is a helpful response from the AI assistant.')).toBeInTheDocument()
    })

    // Now should be able to send another message
    expect(input).not.toBeDisabled()
    await user.type(input, 'Second message')
    expect(sendButton).not.toBeDisabled()
  })
})