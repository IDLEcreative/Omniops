"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Globe, MessageCircle, RefreshCw, Search, CheckSquare, BarChart3 } from "lucide-react";
import { useRealtimeConversations } from "@/hooks/use-realtime-conversations";
import { ConversationTranscript } from "@/components/dashboard/conversation-transcript";
import { ConversationListWithPagination } from "@/components/dashboard/conversations/ConversationListWithPagination";
import { ConversationMetricsCards } from "@/components/dashboard/conversations/ConversationMetricsCards";
import { ConversationHeader } from "@/components/dashboard/conversations/ConversationHeader";
import { KeyboardShortcutsModal } from "@/components/dashboard/conversations/KeyboardShortcutsModal";
import { ExportDialog } from "@/components/dashboard/conversations/ExportDialog";
import { AdvancedFilters, type AdvancedFilterState } from "@/components/dashboard/conversations/AdvancedFilters";
import { LiveStatusIndicator } from "@/components/dashboard/conversations/LiveStatusIndicator";
import { useKeyboardShortcuts, formatShortcut, type KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { BulkActionBar } from "@/components/dashboard/conversations/BulkActionBar";
import { ConversationAnalytics } from "@/components/dashboard/conversations/ConversationAnalytics";

type DateRangeValue = "24h" | "7d" | "30d" | "90d";

const RANGE_TO_DAYS: Record<DateRangeValue, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};


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

  // Calculate date range for export filters
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
    // Scroll to top of conversation list if there are new conversations
    if (data?.recent?.[0]) {
      setSelectedConversationId(data.recent[0].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [acknowledgeNew, data]);

  const filteredConversations = useMemo(() => {
    if (!data) return [];
    let filtered = data.recent;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(conv => conv.status === activeTab);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((conversation) => {
        const messageMatch = conversation.message.toLowerCase().includes(term);
        const customerMatch = (conversation.customerName?.toLowerCase() ?? "").includes(term);
        return messageMatch || customerMatch;
      });
    }

    // Filter by language (advanced filters)
    if (advancedFilters.languages.length > 0) {
      filtered = filtered.filter(conv =>
        advancedFilters.languages.includes(conv.metadata?.language || 'Unknown')
      );
    }

    return filtered;
  }, [data, searchTerm, activeTab, advancedFilters]);

  // Keyboard navigation functions
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

  // Selection mode handlers
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

  // Define keyboard shortcuts
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

  // Enable keyboard shortcuts
  useKeyboardShortcuts(shortcuts);

  // Format shortcuts for display in modal
  const displayShortcuts = useMemo(() =>
    shortcuts.map(s => ({
      keys: formatShortcut(s),
      description: s.description
    }))
  , [shortcuts]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-muted-foreground">
            Monitor live conversations, recent sentiment, and language coverage.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Tabs value={mainView} onValueChange={(val) => setMainView(val as typeof mainView)}>
            <TabsList>
              <TabsTrigger value="conversations">
                <MessageCircle className="h-4 w-4 mr-2" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as DateRangeValue)}>
            <SelectTrigger className="w-34">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <LiveStatusIndicator
            isLive={isLive}
            onToggle={toggleLive}
            lastFetchTime={lastFetch}
            newCount={newConversationsCount}
            onAcknowledge={handleAcknowledgeNew}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            aria-label="Refresh conversations"
            aria-busy={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="icon"
            onClick={toggleSelectionMode}
            aria-label={selectionMode ? "Exit selection mode" : "Enter selection mode"}
            title={selectionMode ? "Exit selection mode" : "Select multiple conversations"}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <ExportDialog
            selectedIds={selectedIds.size > 0 ? Array.from(selectedIds) : undefined}
            currentFilters={{
              status: activeTab,
              dateRange: dateRangeForExport,
              searchTerm: searchTerm.trim() || undefined,
            }}
          />
          <KeyboardShortcutsModal shortcuts={displayShortcuts} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            We couldn’t load conversation stats. Try refreshing or adjust the date range.
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
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>Share of conversations by language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && !data ? (
              <SkeletonList count={4} />
            ) : data && data.languages.length > 0 ? (
              data.languages.map((entry) => (
                <div key={entry.language} className="flex items-center justify-between text-sm">
                  <span>{entry.language}</span>
                  <span className="font-medium">{entry.percentage}%</span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Globe}
                title="No language data"
                description="Language diversity metrics will appear as international customers engage"
                variant="compact"
              />
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-8 flex flex-col border rounded-lg">
          <div className="p-4 border-b flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                ref={searchInputRef}
                className="pl-8"
                placeholder="Search conversations… (Press / to focus)"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search conversations by message content or customer name"
              />
            </div>
            <AdvancedFilters
              availableLanguages={availableLanguages}
              currentFilters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>

          <div className="flex h-[600px]">
            <div className="w-80 border-r">
              <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} defaultValue="all" className="flex h-full flex-col">
                <TabsList className="grid grid-cols-4 px-4" role="tablist" aria-label="Filter conversations by status">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="waiting">Waiting</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="flex-1 mt-0">
                  <ConversationListWithPagination
                    conversations={filteredConversations}
                    loading={loading && !data}
                    searchTerm={searchTerm}
                    selectedId={selectedConversationId}
                    onSelect={setSelectedConversationId}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    emptyTitle="No conversations yet"
                    emptyDescription="Conversations will appear here once customers start chatting"
                    isSelectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectConversation}
                    onSelectAll={selectAllConversations}
                  />
                </TabsContent>
                <TabsContent value="active" className="flex-1 mt-0">
                  <ConversationListWithPagination
                    conversations={filteredConversations}
                    loading={loading && !data}
                    searchTerm={searchTerm}
                    selectedId={selectedConversationId}
                    onSelect={setSelectedConversationId}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    emptyTitle="No active conversations"
                    emptyDescription="Active conversations will appear here"
                    isSelectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectConversation}
                    onSelectAll={selectAllConversations}
                  />
                </TabsContent>
                <TabsContent value="waiting" className="flex-1 mt-0">
                  <ConversationListWithPagination
                    conversations={filteredConversations}
                    loading={loading && !data}
                    searchTerm={searchTerm}
                    selectedId={selectedConversationId}
                    onSelect={setSelectedConversationId}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    emptyTitle="No waiting conversations"
                    emptyDescription="Conversations awaiting response will appear here"
                    isSelectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectConversation}
                    onSelectAll={selectAllConversations}
                  />
                </TabsContent>
                <TabsContent value="resolved" className="flex-1 mt-0">
                  <ConversationListWithPagination
                    conversations={filteredConversations}
                    loading={loading && !data}
                    searchTerm={searchTerm}
                    selectedId={selectedConversationId}
                    onSelect={setSelectedConversationId}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    emptyTitle="No resolved conversations"
                    emptyDescription="Resolved conversations will appear here"
                    isSelectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectConversation}
                    onSelectAll={selectAllConversations}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  <ConversationHeader
                    conversation={selectedConversation}
                    onActionComplete={refresh}
                  />

                  <ConversationTranscript
                    conversationId={selectedConversationId}
                    className="flex-1"
                  />
                </>
              ) : (
                <EmptyState
                  icon={MessageCircle}
                  title="Select a conversation"
                  description="Choose a conversation from the list to view details"
                  variant="default"
                  className="flex-1"
                />
              )}
            </div>
          </div>
        </div>
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

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-8 w-full rounded bg-muted animate-pulse" />
      ))}
    </div>
  );
}

