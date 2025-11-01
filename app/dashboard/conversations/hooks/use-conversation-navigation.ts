/**
 * Conversation Navigation Hook
 */

import { useCallback } from 'react';

interface Conversation {
  id: string;
  [key: string]: any;
}

export function useConversationNavigation(
  filteredConversations: Conversation[],
  selectedConversationId: string | null,
  setSelectedConversationId: (id: string | null) => void
) {
  const selectNextConversation = useCallback(() => {
    if (!filteredConversations.length) return;
    if (!selectedConversationId) {
      const firstConv = filteredConversations[0];
      if (firstConv) setSelectedConversationId(firstConv.id);
      return;
    }
    const currentIndex = filteredConversations.findIndex(c => c.id === selectedConversationId);
    const nextIndex = (currentIndex + 1) % filteredConversations.length;
    const nextConv = filteredConversations[nextIndex];
    if (nextConv) setSelectedConversationId(nextConv.id);
  }, [selectedConversationId, filteredConversations, setSelectedConversationId]);

  const selectPreviousConversation = useCallback(() => {
    if (!filteredConversations.length) return;
    if (!selectedConversationId) {
      const firstConv = filteredConversations[0];
      if (firstConv) setSelectedConversationId(firstConv.id);
      return;
    }
    const currentIndex = filteredConversations.findIndex(c => c.id === selectedConversationId);
    const previousIndex = currentIndex === 0
      ? filteredConversations.length - 1
      : currentIndex - 1;
    const prevConv = filteredConversations[previousIndex];
    if (prevConv) setSelectedConversationId(prevConv.id);
  }, [selectedConversationId, filteredConversations, setSelectedConversationId]);

  return {
    selectNextConversation,
    selectPreviousConversation
  };
}
