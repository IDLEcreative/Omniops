import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle } from "lucide-react";
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
  const allSelected = conversations.length > 0 && conversations.every(c => selectedIds.has(c.id));
  const someSelected = conversations.some(c => selectedIds.has(c.id)) && !allSelected;

  return (
    <div className="h-full flex flex-col">
      {isSelectionMode && onSelectAll && conversations.length > 0 && !loading && (
        <div className="border-b px-4 py-2 bg-muted/50 flex items-center gap-2">
          <Checkbox
            checked={someSelected ? "indeterminate" : allSelected}
            onCheckedChange={(checked) => onSelectAll(!!checked)}
            aria-label="Select all conversations"
          />
          <span className="text-sm text-muted-foreground">
            Select all on this page
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
            {conversations.map((conversation) => (
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
      {hasMore && !loading && conversations.length > 0 && (
        <div className="p-3 border-t bg-background">
          <Button
            variant="outline"
            className="w-full"
            onClick={onLoadMore}
            disabled={loadingMore}
            aria-label="Load more conversations"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
