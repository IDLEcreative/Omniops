import { useState, useRef, useCallback } from 'react';
import { Message } from '@/types';

export interface UseMessageStateProps {
  conversationId: string;
  sessionId: string;
  demoConfig?: any;
  storage: any;
}

export interface MessageState {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadingMessages: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  loadPreviousMessages: (convId: string, sessId: string) => Promise<void>;
}

/**
 * Manages message state and message loading from API
 * Handles message list, input state, and loading states
 */
export function useMessageState({
  conversationId,
  sessionId,
  demoConfig,
  storage,
}: UseMessageStateProps): MessageState {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasLoadedMessages = useRef(false);

  // Fetch previous messages from API
  const loadPreviousMessages = useCallback(
    async (convId: string, sessId: string) => {
      if (!convId || !sessId || hasLoadedMessages.current) {
        return;
      }

      setLoadingMessages(true);
      hasLoadedMessages.current = true;

      try {
        // Build API URL - use serverUrl from config if available
        const apiUrl = demoConfig?.serverUrl
          ? `${demoConfig.serverUrl}/api/conversations/${convId}/messages?session_id=${sessId}`
          : `/api/conversations/${convId}/messages?session_id=${sessId}`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.messages && data.messages.length > 0) {
            console.log('[useMessageState] Loaded previous messages:', data.messages.length);
            setMessages(data.messages);
          } else {
            // Conversation not found or expired - clear stored ID
            console.log('[useMessageState] No messages found, clearing conversation ID');
            storage.removeItem('conversation_id');
            hasLoadedMessages.current = false; // Reset to allow new conversation
          }
        } else {
          // API error - clear stored ID to start fresh
          console.warn('[useMessageState] Failed to load messages, clearing conversation ID');
          storage.removeItem('conversation_id');
          hasLoadedMessages.current = false; // Reset to allow new conversation
        }
      } catch (error) {
        console.error('[useMessageState] Error loading messages:', error);
        // On error, clear stored conversation to allow fresh start
        storage.removeItem('conversation_id');
        hasLoadedMessages.current = false; // Reset to allow new conversation
      } finally {
        setLoadingMessages(false);
      }
    },
    [demoConfig, storage]
  );

  return {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    loadingMessages,
    messagesContainerRef,
    loadPreviousMessages,
  };
}
