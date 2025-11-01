/**
 * Conversation State Management Hook
 */

import { useState, useCallback } from 'react';
import type { AdvancedFilterState } from '@/components/dashboard/conversations/AdvancedFilters';
import type { DateRangeValue } from '@/lib/conversations/constants';

export function useConversationState() {
  const [selectedRange, setSelectedRange] = useState<DateRangeValue>("7d");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [mainView, setMainView] = useState<'conversations' | 'analytics'>('conversations');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'waiting' | 'resolved'>('all');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({
    languages: [],
    customerType: "all",
    messageLength: "all",
    dateRange: null,
  });

  const clearConversationSelection = useCallback(() => {
    setSelectedConversationId(null);
    setSearchTerm("");
  }, []);

  return {
    selectedRange,
    setSelectedRange,
    selectedConversationId,
    setSelectedConversationId,
    searchTerm,
    setSearchTerm,
    refreshing,
    setRefreshing,
    mainView,
    setMainView,
    activeTab,
    setActiveTab,
    advancedFilters,
    setAdvancedFilters,
    clearConversationSelection
  };
}
