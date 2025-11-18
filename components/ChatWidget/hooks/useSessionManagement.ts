import { useState, useEffect, useCallback, useRef } from 'react';

// Properly typed storage interface
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
}

export interface UseSessionManagementProps {
  storage: StorageAdapter;
  mounted: boolean;
}

export interface SessionManagementState {
  sessionId: string;
  conversationId: string;
  setConversationId: (id: string) => void;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Generates a unique session ID
 * Format: session_<timestamp>_<random>
 */
function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 11);
  return `session_${timestamp}_${random}`;
}

/**
 * Manages session and conversation IDs with persistence
 *
 * Features:
 * - Restores session from storage on mount
 * - Persists conversation ID changes
 * - Handles async storage operations safely
 * - Prevents race conditions on unmount
 *
 * @param storage - Storage adapter for persistence
 * @param mounted - Whether parent component is mounted
 * @returns Session state and setters
 */
export function useSessionManagement({
  storage,
  mounted,
}: UseSessionManagementProps): SessionManagementState {
  const [sessionId, setSessionId] = useState<string>('');
  const [conversationId, setConversationIdState] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  // Initialize session ID on mount
  useEffect(() => {
    const initializeStorage = async () => {
      if (!isMountedRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch both IDs in parallel
        const [storedSessionId, storedConversationId] = await Promise.all([
          storage.getItem('session_id'),
          storage.getItem('conversation_id'),
        ]);

        // Check if still mounted before updating state
        if (!isMountedRef.current) return;

        if (process.env.NODE_ENV === 'development') {
          console.log('[useSessionManagement] Restored from storage:', {
            session_id: storedSessionId,
            conversation_id: storedConversationId,
          });
        }

        // Restore or create session ID
        if (storedSessionId) {
          setSessionId(storedSessionId);
        } else {
          const newSessionId = generateSessionId();
          await storage.setItem('session_id', newSessionId);
          if (!isMountedRef.current) return;
          setSessionId(newSessionId);

          if (process.env.NODE_ENV === 'development') {
          }
        }

        // Restore conversation ID if exists
        if (storedConversationId) {
          setConversationIdState(storedConversationId);
        }
      } catch (err) {
        if (!isMountedRef.current) return;

        const error = err instanceof Error ? err : new Error('Failed to initialize storage');
        console.error('[useSessionManagement] Initialization error:', error);
        setError(error);

        // Fallback: create session ID in memory
        setSessionId(generateSessionId());
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeStorage();

    // Cleanup: mark as unmounted
    return () => {
      isMountedRef.current = false;
    };
  }, [storage]); // storage is the only dependency

  // Memoized setter that persists to storage
  const setConversationId = useCallback(
    async (id: string) => {
      // Update state immediately for UI responsiveness
      setConversationIdState(id);

      // Persist to storage (don't block UI)
      if (mounted) {
        try {
          await storage.setItem('conversation_id', id);

          if (process.env.NODE_ENV === 'development') {
          }
        } catch (err) {
          console.warn('[useSessionManagement] Failed to persist conversation ID:', err);
          // Don't set error state - this is non-critical
        }
      }
    },
    [mounted, storage]
  );

  return {
    sessionId,
    conversationId,
    setConversationId,
    isLoading,
    error,
  };
}
