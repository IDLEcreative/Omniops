/**
 * Conversations Page - Main Component
 */

"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRealtimeConversations } from "@/hooks/use-realtime-conversations";
import { ConversationMetricsCards } from "@/components/dashboard/conversations/ConversationMetricsCards";
import { ConversationsPageHeader } from "@/components/dashboard/conversations/ConversationsPageHeader";
import { LanguageDistributionCard } from "@/components/dashboard/conversations/LanguageDistributionCard";
import { ConversationMainContainer } from "@/components/dashboard/conversations/ConversationMainContainer";
import { BulkActionBar } from "@/components/dashboard/conversations/BulkActionBar";
import { ConversationAnalytics } from "@/components/dashboard/conversations/ConversationAnalytics";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { RANGE_TO_DAYS } from "@/lib/conversations/constants";
import { useConversationState, useBulkSelection, useConversationNavigation } from "./hooks";
import { useFilteredConversations, useActiveFilterCount } from "./utils/filters";
import { useConversationShortcuts } from "./utils/keyboard-shortcuts";

export default function ConversationsPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
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
  } = useConversationState();

  const {
    selectionMode,
    selectedIds,
    toggleSelectionMode,
    toggleSelectConversation,
    selectAllConversations,
    clearBulkSelection
  } = useBulkSelection();

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
  }, [data, loading, setSelectedConversationId]);

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

  const activeFilterCount = useActiveFilterCount(advancedFilters);
  const filteredConversations = useFilteredConversations(data, searchTerm, activeTab, advancedFilters);

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
  }, [acknowledgeNew, data, setSelectedConversationId]);

  const { selectNextConversation, selectPreviousConversation } = useConversationNavigation(
    filteredConversations,
    selectedConversationId,
    setSelectedConversationId
  );

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleBulkActionComplete = useCallback(() => {
    refresh();
    clearBulkSelection();
  }, [refresh, clearBulkSelection]);

  const { shortcuts, displayShortcuts } = useConversationShortcuts(
    selectNextConversation,
    selectPreviousConversation,
    clearConversationSelection,
    focusSearch,
    handleRefresh,
    setActiveTab
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex-1 space-y-4 p-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
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
            onSelectAll={(selected) => selectAllConversations(filteredConversations, selected)}
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
