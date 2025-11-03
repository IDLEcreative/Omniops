import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { ConversationListItem } from "./ConversationListItem";

interface ConversationListProps {
  conversations: Array<{
    id: string;
    message: string;
    timestamp: string;
    status: 'active' | 'waiting' | 'resolved';
    customerName: string | null;
  }>;
  loading: boolean;
  searchTerm: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  emptyTitle: string;
  emptyDescription: string;
  isSelectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-16 w-full rounded bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export function ConversationListWithPagination({
  conversations,
  loading,
  searchTerm,
  selectedId,
  onSelect,
  hasMore,
  loadingMore,
  onLoadMore,
  emptyTitle,
  emptyDescription,
  isSelectionMode = false,
  selectedIds = new Set(),
  onToggleSelect,
  onSelectAll,
}: ConversationListProps) {
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when conversations change (e.g., tab change, search)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, conversations.length]);

  // Calculate pagination
  const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedConversations = conversations.slice(startIndex, endIndex);

  const allSelected = paginatedConversations.length > 0 && paginatedConversations.every(c => selectedIds.has(c.id));
  const someSelected = paginatedConversations.some(c => selectedIds.has(c.id)) && !allSelected;

  // Performance: Memoized to prevent recreation on every render
  // and maintain stable reference for Checkbox child component
  const handleSelectAll = useCallback((checked: boolean) => {
    onSelectAll?.(checked);
  }, [onSelectAll]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  return (
    <div className="h-full flex flex-col">
      {isSelectionMode && onSelectAll && paginatedConversations.length > 0 && !loading && (
        <div className="border-b px-4 py-2 bg-muted/50 flex items-center gap-2">
          <Checkbox
            checked={someSelected ? "indeterminate" : allSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all conversations on this page"
          />
          <span className="text-sm text-muted-foreground">
            Select all on this page ({paginatedConversations.length} items)
          </span>
        </div>
      )}
      <ScrollArea className="flex-1">
        {loading ? (
          <SkeletonList count={6} />
        ) : conversations.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={MessageCircle}
              title={searchTerm ? "No matches found" : emptyTitle}
              description={searchTerm ? "Try adjusting your search terms" : emptyDescription}
              variant="default"
            />
          </div>
        ) : (
          <>
            {paginatedConversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedId === conversation.id}
                onSelect={() => onSelect(conversation.id)}
                isSelectionMode={isSelectionMode}
                isChecked={selectedIds.has(conversation.id)}
                onToggleSelect={onToggleSelect ? () => onToggleSelect(conversation.id) : undefined}
              />
            ))}
          </>
        )}
      </ScrollArea>
      {!loading && conversations.length > 0 && totalPages > 1 && (
        <div className="p-3 border-t bg-background">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
