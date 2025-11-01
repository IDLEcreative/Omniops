/**
 * Conversation Filtering Utilities
 */

import { useMemo } from 'react';
import type { AdvancedFilterState } from '@/components/dashboard/conversations/AdvancedFilters';

interface ConversationItem {
  id: string;
  status: string;
  message: string;
  customerName?: string;
  metadata?: { language?: string };
}

export function useFilteredConversations(
  data: { recent: ConversationItem[] } | null,
  searchTerm: string,
  activeTab: string,
  advancedFilters: AdvancedFilterState
) {
  return useMemo(() => {
    if (!data) return [];
    let filtered = data.recent;

    if (activeTab !== 'all') {
      filtered = filtered.filter(conv => conv.status === activeTab);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((conversation) => {
        const messageMatch = conversation.message.toLowerCase().includes(term);
        const customerMatch = (conversation.customerName?.toLowerCase() ?? "").includes(term);
        return messageMatch || customerMatch;
      });
    }

    if (advancedFilters.languages.length > 0) {
      filtered = filtered.filter(conv =>
        advancedFilters.languages.includes(conv.metadata?.language || 'Unknown')
      );
    }

    return filtered;
  }, [data, searchTerm, activeTab, advancedFilters]);
}

export function useActiveFilterCount(advancedFilters: AdvancedFilterState) {
  return useMemo(() => {
    let count = 0;
    if (advancedFilters.languages.length > 0) count++;
    if (advancedFilters.customerType !== 'all') count++;
    if (advancedFilters.messageLength !== 'all') count++;
    if (advancedFilters.dateRange) count++;
    return count;
  }, [advancedFilters]);
}
