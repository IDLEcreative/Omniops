import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversationTranscript } from '@/types/dashboard';

export type { ConversationMessage, ConversationTranscript } from '@/types/dashboard';

interface UseConversationTranscriptOptions {
  conversationId: string | null;
  disabled?: boolean;
}

interface UseConversationTranscriptResult {
  data: ConversationTranscript | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useConversationTranscript(
  options: UseConversationTranscriptOptions
): UseConversationTranscriptResult {
  const { conversationId, disabled = false } = options;
  const [data, setData] = useState<ConversationTranscript | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (disabled || !conversationId) {
      setData(null);
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/dashboard/conversations/${conversationId}`,
        {
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Conversation not found');
        }
        throw new Error(`Failed to load transcript (${response.status})`);
      }

      const payload = (await response.json()) as ConversationTranscript;
      setData(payload);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err as Error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [conversationId, disabled]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
}
