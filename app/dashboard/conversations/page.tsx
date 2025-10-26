"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRealtimeConversations } from "@/hooks/use-realtime-conversations";
import { ConversationMetricsCards } from "@/components/dashboard/conversations/ConversationMetricsCards";
import { ConversationsPageHeader } from "@/components/dashboard/conversations/ConversationsPageHeader";
import { LanguageDistributionCard } from "@/components/dashboard/conversations/LanguageDistributionCard";
import { ConversationMainContainer } from "@/components/dashboard/conversations/ConversationMainContainer";
import { BulkActionBar } from "@/components/dashboard/conversations/BulkActionBar";
import { ConversationAnalytics } from "@/components/dashboard/conversations/ConversationAnalytics";
import { type AdvancedFilterState } from "@/components/dashboard/conversations/AdvancedFilters";
import { useKeyboardShortcuts, formatShortcut, type KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { RANGE_TO_DAYS, type DateRangeValue } from "@/lib/conversations/constants";

export default function ConversationsPage() {
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const days = RANGE_TO_DAYS[selectedRange] ?? 7;
  const {
    data,
    loading,
    error,
    refresh,
    loadMore,
    loadingMore,
    hasMore,
    isLive,
    toggleLive,
    lastFetch,
    newConversationsCount,
    acknowledgeNew
  } = useRealtimeConversations({ days, enabled: true });

  const dateRangeForExport = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    return {
      start: start.toISOString(),
      end: now.toISOString(),
    };
  }, [days]);

  useEffect(() => {
    if (loading) return;
    const first = data?.recent?.[0];
    if (first) {
      setSelectedConversationId((current) => current ?? first.id);
    }
  }, [data, loading]);

  const selectedConversation = useMemo(() => {
    if (!data) return null;
    return data.recent.find((item) => item.id === selectedConversationId) ?? null;
  }, [data, selectedConversationId]);

  const totalStatus = useMemo(() => {
    if (!data) return 0;
    return Object.values(data.statusCounts).reduce((acc, value) => acc + value, 0);
  }, [data]);

  const availableLanguages = useMemo(() => {
    if (!data) return [];
    return data.languages.map(lang => lang.language);
  }, [data]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.languages.length > 0) count++;
    if (advancedFilters.customerType !== 'all') count++;
    if (advancedFilters.messageLength !== 'all') count++;
    if (advancedFilters.dateRange) count++;
    return count;
  }, [advancedFilters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcknowledgeNew = useCallback(() => {
    acknowledgeNew();
    if (data?.recent?.[0]) {
      setSelectedConversationId(data.recent[0].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [acknowledgeNew, data]);

  const filteredConversations = useMemo(() => {
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
  }, [selectedConversationId, filteredConversations]);

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
  }, [selectedConversationId, filteredConversations]);

  const clearConversationSelection = useCallback(() => {
    setSelectedConversationId(null);
    setSearchTerm("");
  }, []);

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      setSelectedIds(new Set());
    }
  }, [selectionMode]);

  const toggleSelectConversation = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAllConversations = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(filteredConversations.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredConversations]);

  const clearBulkSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkActionComplete = useCallback(() => {
    refresh();
    setSelectedIds(new Set());
  }, [refresh]);

  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    { key: 'j', callback: selectNextConversation, description: 'Next conversation' },
    { key: 'ArrowDown', callback: selectNextConversation, description: 'Next conversation' },
    { key: 'k', callback: selectPreviousConversation, description: 'Previous conversation' },
    { key: 'ArrowUp', callback: selectPreviousConversation, description: 'Previous conversation' },
    { key: 'Escape', callback: clearConversationSelection, description: 'Clear selection' },
    { key: '/', callback: focusSearch, description: 'Focus search' },
    { key: 'r', callback: handleRefresh, description: 'Refresh data' },
    { key: '1', callback: () => setActiveTab('all'), description: 'All conversations' },
    { key: '2', callback: () => setActiveTab('active'), description: 'Active conversations' },
    { key: '3', callback: () => setActiveTab('waiting'), description: 'Waiting conversations' },
    { key: '4', callback: () => setActiveTab('resolved'), description: 'Resolved conversations' },
  ], [selectNextConversation, selectPreviousConversation, clearConversationSelection, focusSearch, handleRefresh]);

  useKeyboardShortcuts(shortcuts);

  const displayShortcuts = useMemo(() =>
    shortcuts.map(s => ({
      keys: formatShortcut(s),
      description: s.description
    }))
  , [shortcuts]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <ConversationsPageHeader
        mainView={mainView}
        onMainViewChange={setMainView}
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        isLive={isLive}
        onToggleLive={toggleLive}
        lastFetch={lastFetch}
        newCount={newConversationsCount}
        onAcknowledgeNew={handleAcknowledgeNew}
        onRefresh={handleRefresh}
        loading={loading}
        refreshing={refreshing}
        selectionMode={selectionMode}
        onToggleSelectionMode={toggleSelectionMode}
        selectedIds={selectedIds}
        activeTab={activeTab}
        dateRangeForExport={dateRangeForExport}
        searchTerm={searchTerm}
        displayShortcuts={displayShortcuts}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            We couldn't load conversation stats. Try refreshing or adjust the date range.
          </AlertDescription>
        </Alert>
      )}

      {mainView === 'conversations' && (
        <ConversationMetricsCards data={data} loading={loading} totalStatus={totalStatus} />
      )}

      {mainView === 'analytics' ? (
        <ConversationAnalytics days={days} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <LanguageDistributionCard
            languages={data?.languages ?? []}
            loading={loading && !data}
          />

          <ConversationMainContainer
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchInputRef={searchInputRef}
            availableLanguages={availableLanguages}
            advancedFilters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            activeFilterCount={activeFilterCount}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            filteredConversations={filteredConversations}
            loading={loading && !data}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            selectedConversation={selectedConversation}
            onActionComplete={refresh}
            isSelectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectConversation}
            onSelectAll={selectAllConversations}
          />
        </div>
      )}

      {mainView === 'conversations' && selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClear={clearBulkSelection}
          onActionComplete={handleBulkActionComplete}
          selectedIds={selectedIds}
        />
      )}
    </div>
  );
}
