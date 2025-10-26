import { EmptyState } from "@/components/ui/empty-state";
import { MessageCircle } from "lucide-react";
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
  return (
    <div className="lg:col-span-8 flex flex-col border rounded-lg">
      <SearchAndFiltersBar
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchInputRef={searchInputRef}
        availableLanguages={availableLanguages}
        currentFilters={advancedFilters}
        onFiltersChange={onFiltersChange}
        activeFilterCount={activeFilterCount}
      />

      <div className="flex h-[600px]">
        <div className="w-80 border-r">
          <ConversationTabbedList
            activeTab={activeTab}
            onTabChange={onTabChange}
            conversations={filteredConversations}
            loading={loading}
            searchTerm={searchTerm}
            selectedId={selectedConversationId}
            onSelect={onSelectConversation}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
          />
        </div>

        <div className="flex-1 flex flex-col">
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
