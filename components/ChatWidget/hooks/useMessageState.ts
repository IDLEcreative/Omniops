import { useState, useRef, useCallback, useEffect } from 'react';
import { Message } from '@/types';
import type { StorageAdapter } from './useSessionManagement';
import type { ChatWidgetConfig } from './useChatState';

export interface UseMessageStateProps {
  conversationId: string;
  sessionId: string;
  demoConfig?: ChatWidgetConfig | null;
  storage: StorageAdapter;
  isSendingRef?: React.MutableRefObject<boolean>; // Track if message send is in progress
}

export interface MessageState {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadingMessages: boolean;
  messagesLoadError: Error | null;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  loadPreviousMessages: (convId: string, sessId: string) => Promise<void>;
  retryLoadMessages: () => Promise<void>;
}

/**
 * Manages message state and message loading from API
 *
 * Features:
 * - Message list management
 * - Input state management
 * - Loading states for messages
 * - Previous message loading from API
 * - Error handling with retry capability
 * - Race condition prevention on unmount
 *
 * @param conversationId - Current conversation ID
 * @param sessionId - Current session ID
 * @param demoConfig - Widget configuration
 * @param storage - Storage adapter for persistence
 * @returns Message state and handlers
 */
export function useMessageState({
  conversationId,
  sessionId,
  demoConfig,
  storage,
  isSendingRef,
}: UseMessageStateProps): MessageState {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesLoadError, setMessagesLoadError] = useState<Error | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasLoadedMessages = useRef(false);
  const isMountedRef = useRef(true);

  // Store last attempted load params for retry
  const lastLoadParams = useRef<{ convId: string; sessId: string } | null>(null);

  /**
   * Fetch previous messages from API
   * Handles conversation not found, API errors, and race conditions
   */
  const loadPreviousMessages = useCallback(
    async (convId: string, sessId: string) => {
      // CRITICAL: Don't load from DB if a message send is in progress
      // This prevents overwriting fresh optimistic updates with stale DB data
      if (isSendingRef?.current) {
        console.log('[useMessageState] ⏸️ Skipping loadPreviousMessages - message send in progress');
        return;
      }

      if (!convId || !sessId || hasLoadedMessages.current) {
        return;
      }

      if (!isMountedRef.current) return;

      setLoadingMessages(true);
      setMessagesLoadError(null);
      hasLoadedMessages.current = true;
      lastLoadParams.current = { convId, sessId };

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

        // Check if still mounted before processing response
        if (!isMountedRef.current) return;

        if (response.ok) {
          const data = await response.json();

          if (!isMountedRef.current) return;

          console.log('[useMessageState] 📥 Received API response:', {
            success: data.success,
            messageCount: data.messages?.length || 0,
            allMessages: data.messages?.map((m: any) => ({
              role: m.role,
              hasMetadata: !!m.metadata,
              metadataKeys: m.metadata ? Object.keys(m.metadata) : [],
              shoppingProducts: m.metadata?.shoppingProducts?.length || 0,
              metadata: m.metadata
            }))
          });

          if (data.success && data.messages && data.messages.length > 0) {
            console.log('[useMessageState] 📦 Loaded previous messages from DB:', {
              count: data.messages.length,
              lastMessage: data.messages[data.messages.length - 1],
              hasMetadata: !!data.messages[data.messages.length - 1]?.metadata?.shoppingProducts
            });

            // SMART MERGE: If DB has more messages or fresh metadata, use DB version
            // Otherwise keep current state to prevent overwriting optimistic updates
            setMessages(prev => {
              console.log('[useMessageState] 🤔 Smart merge decision - Current state:', {
                currentLength: prev.length,
                dbLength: data.messages.length,
                lastStateMsg: prev[prev.length - 1],
                lastDbMsg: data.messages[data.messages.length - 1]
              });

              if (prev.length === 0) {
                console.log('[useMessageState] ✅ Loading messages (state was empty)');
                return data.messages;
              } else if (data.messages.length > prev.length) {
                console.log('[useMessageState] ✅ Loading messages (DB has more:', data.messages.length, 'vs', prev.length, ')');
                return data.messages;
              } else if (data.messages.length === prev.length) {
                // Check if last DB message has metadata that's missing in state
                const lastDbMsg = data.messages[data.messages.length - 1];
                const lastStateMsg = prev[prev.length - 1];

                if (!lastDbMsg || !lastStateMsg) {
                  console.log('[useMessageState] ⚠️ Missing last message in comparison');
                  return prev;
                }

                console.log('[useMessageState] 🔍 Comparing last messages:', {
                  sameId: lastDbMsg.id === lastStateMsg.id,
                  dbHasMetadata: !!lastDbMsg.metadata?.shoppingProducts,
                  stateHasMetadata: !!lastStateMsg.metadata?.shoppingProducts,
                  dbProducts: lastDbMsg.metadata?.shoppingProducts?.length || 0,
                  stateProducts: lastStateMsg.metadata?.shoppingProducts?.length || 0
                });

                if (lastDbMsg.id === lastStateMsg.id &&
                    lastDbMsg.metadata?.shoppingProducts &&
                    !lastStateMsg.metadata?.shoppingProducts) {
                  console.log('[useMessageState] ✅ Loading messages (DB has metadata, state missing it)');
                  return data.messages;
                }
              }

              console.log('[useMessageState] ⚠️ Skipping load - current state is up to date');
              return prev;
            });
          } else {
            // Conversation not found or expired - clear stored ID
            if (process.env.NODE_ENV === 'development') {
              console.log('[useMessageState] No messages found, clearing conversation ID');
            }
            if (storage?.removeItem) {
              await storage.removeItem('conversation_id');
            }
            hasLoadedMessages.current = false; // Reset to allow new conversation
          }
        } else {
          // API error - clear stored ID to start fresh
          if (!isMountedRef.current) return;

          const error = new Error(`Failed to load messages: ${response.status} ${response.statusText}`);
          console.warn('[useMessageState] API error:', error);
          setMessagesLoadError(error);

          if (storage?.removeItem) {
            await storage.removeItem('conversation_id');
          }
          hasLoadedMessages.current = false; // Reset to allow new conversation
        }
      } catch (err) {
        if (!isMountedRef.current) return;

        const error = err instanceof Error ? err : new Error('Failed to load messages');
        console.error('[useMessageState] Error loading messages:', error);
        setMessagesLoadError(error);

        // On error, clear stored conversation to allow fresh start
        try {
          if (storage?.removeItem) {
            await storage.removeItem('conversation_id');
          }
        } catch (storageErr) {
          console.warn('[useMessageState] Failed to clear conversation ID:', storageErr);
        }
        hasLoadedMessages.current = false; // Reset to allow new conversation
      } finally {
        if (isMountedRef.current) {
          setLoadingMessages(false);
        }
      }
    },
    [demoConfig?.serverUrl, storage]
  );

  /**
   * Retry loading messages after a failure
   */
  const retryLoadMessages = useCallback(async () => {
    if (!lastLoadParams.current) {
      console.warn('[useMessageState] No previous load attempt to retry');
      return;
    }

    hasLoadedMessages.current = false; // Reset to allow retry
    await loadPreviousMessages(
      lastLoadParams.current.convId,
      lastLoadParams.current.sessId
    );
  }, [loadPreviousMessages]);

  // Cleanup on unmount - use useEffect instead of standalone useCallback
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    loadingMessages,
    messagesLoadError,
    messagesContainerRef: messagesContainerRef as React.RefObject<HTMLDivElement>,
    loadPreviousMessages,
    retryLoadMessages,
  };
}
