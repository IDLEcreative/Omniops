import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageCircle, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationTranscript } from "@/components/dashboard/conversation-transcript";
import { SearchAndFiltersBar } from "./SearchAndFiltersBar";
import { ConversationTabbedList } from "./ConversationTabbedList";
import { type AdvancedFilterState } from "./AdvancedFilters";
import { type DashboardConversation } from "@/types/dashboard";
import { RefObject } from "react";

interface ConversationMainContainerProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  availableLanguages: string[];
  advancedFilters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  activeFilterCount: number;
  activeTab: 'all' | 'active' | 'waiting' | 'resolved';
  onTabChange: (tab: 'all' | 'active' | 'waiting' | 'resolved') => void;
  filteredConversations: DashboardConversation[];
  loading: boolean;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  selectedConversation: DashboardConversation | null;
  onActionComplete: () => void;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
}

export function ConversationMainContainer({
  searchTerm,
  onSearchChange,
  searchInputRef,
  availableLanguages,
  advancedFilters,
  onFiltersChange,
  activeFilterCount,
  activeTab,
  onTabChange,
  filteredConversations,
  loading,
  selectedConversationId,
  onSelectConversation,
  hasMore,
  loadingMore,
  onLoadMore,
  selectedConversation,
  onActionComplete,
  isSelectionMode,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: ConversationMainContainerProps) {
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  return (
    <div className="flex flex-col border rounded-lg">
      <SearchAndFiltersBar
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchInputRef={searchInputRef}
        availableLanguages={availableLanguages}
        currentFilters={advancedFilters}
        onFiltersChange={onFiltersChange}
        activeFilterCount={activeFilterCount}
      />

      {/* Mobile view toggle - only visible on small screens */}
      <div className="sm:hidden p-2 border-b bg-muted/30 flex gap-2">
        <Button
          variant={mobileView === 'list' ? 'default' : 'outline'}
          onClick={() => setMobileView('list')}
          className="flex-1"
          size="sm"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Conversations
        </Button>
        <Button
          variant={mobileView === 'detail' ? 'default' : 'outline'}
          onClick={() => setMobileView('detail')}
          className="flex-1"
          size="sm"
          disabled={!selectedConversation}
        >
          <FileText className="h-4 w-4 mr-2" />
          Details
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-0 max-h-[calc(100vh-200px)] sm:h-[580px]">
        {/* Sidebar: Show on desktop always, on mobile only if mobileView='list' */}
        <div className={cn(
          "w-full sm:w-[400px] lg:w-[450px]",
          "border-r border-border",
          "flex flex-col",
          // Mobile visibility
          mobileView === 'list' ? 'flex' : 'hidden',
          'sm:flex' // Always show on desktop
        )}>
          <ConversationTabbedList
            activeTab={activeTab}
            onTabChange={onTabChange}
            conversations={filteredConversations}
            loading={loading}
            searchTerm={searchTerm}
            selectedId={selectedConversationId}
            onSelect={(id) => {
              onSelectConversation(id);
              // Auto-switch to detail view on mobile when selecting a conversation
              if (window.innerWidth < 640) {
                setMobileView('detail');
              }
            }}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
          />
        </div>

        {/* Main content: Show on desktop always, on mobile only if mobileView='detail' */}
        <div className={cn(
          "flex-1 flex flex-col",
          // Mobile visibility
          mobileView === 'detail' ? 'flex' : 'hidden',
          'sm:flex' // Always show on desktop
        )}>
          {selectedConversation ? (
            <>
              <ConversationHeader
                conversation={selectedConversation}
                onActionComplete={onActionComplete}
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
  );
}
