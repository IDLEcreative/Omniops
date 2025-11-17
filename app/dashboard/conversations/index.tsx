/**
 * Conversations Page - Main Component
 */

"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRealtimeConversations } from "@/hooks/use-realtime-conversations";
import { ConversationMetricsCards } from "@/components/dashboard/conversations/ConversationMetricsCards";
import { ConversationsPageHeader } from "@/components/dashboard/conversations/ConversationsPageHeader";
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
    lastFetch,
    newConversationsCount,
    acknowledgeNew
  } = useRealtimeConversations({ days });

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
    return data.languages.map((lang) => lang.language);
  }, [data]);

  const metricsCardsData = useMemo(() => {
    if (!data) return null;
    return {
      total: data.metrics.totalConversations,
      change: 0, // Placeholder - would need historical data for real change %
      statusCounts: {
        active: data.statusCounts.active ?? 0,
        waiting: data.statusCounts.waiting ?? 0,
        resolved: data.statusCounts.resolved ?? 0,
      },
      peakHours: [], // Placeholder - would need hourly data
      languages: data.languages.map((lang) => ({
        language: lang.language,
        percentage: Math.round(lang.percentage),
      })),
    };
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
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden p-2 gap-2">
      {/* Skip Navigation - Visible on focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to conversations
      </a>

      {/* Live region for new conversations - Screen reader only */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {newConversationsCount > 0 && (
          `${newConversationsCount} new conversation${newConversationsCount > 1 ? 's' : ''} available. Press Enter to load.`
        )}
      </div>

      {/* Live region for bulk actions - Screen reader only */}
      <div
        role="status"
        aria-live="assertive"
        className="sr-only"
      >
        {selectedIds.size > 0 && (
          `${selectedIds.size} conversation${selectedIds.size > 1 ? 's' : ''} selected for bulk action.`
        )}
      </div>

      <ConversationsPageHeader
        mainView={mainView}
        onMainViewChange={setMainView}
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
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
        <ConversationMetricsCards
          data={metricsCardsData}
          loading={loading}
          totalStatus={totalStatus}
        />
      )}

      {mainView === 'analytics' ? (
        <main id="main-content" tabIndex={-1} className="flex-1 min-h-0">
          <ConversationAnalytics days={days} />
        </main>
      ) : (
        <main id="main-content" tabIndex={-1} className="flex-1 min-h-0">
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
        </main>
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
