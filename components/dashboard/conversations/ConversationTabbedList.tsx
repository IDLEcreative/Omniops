import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationListWithPagination } from "./ConversationListWithPagination";
import { type DashboardConversation } from "@/types/dashboard";

interface ConversationTabbedListProps {
  activeTab: 'all' | 'active' | 'waiting' | 'resolved' | 'human_requested';
  onTabChange: (tab: 'all' | 'active' | 'waiting' | 'resolved' | 'human_requested') => void;
  conversations: DashboardConversation[];
  loading: boolean;
  searchTerm: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
}

export function ConversationTabbedList({
  activeTab,
  onTabChange,
  conversations,
  loading,
  searchTerm,
  selectedId,
  onSelect,
  hasMore,
  loadingMore,
  onLoadMore,
  isSelectionMode,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: ConversationTabbedListProps) {
  // Count human-requested conversations
  const humanRequestedCount = conversations.filter(conv =>
    conv.status === 'waiting' &&
    (conv.metadata as any)?.assigned_to_human === true
  ).length;

  const tabConfigs = [
    { value: 'all' as const, label: 'All', emptyTitle: 'No conversations yet', emptyDescription: 'Conversations will appear here once customers start chatting' },
    { value: 'active' as const, label: 'Active', emptyTitle: 'No active conversations', emptyDescription: 'Active conversations will appear here' },
    { value: 'waiting' as const, label: 'Waiting', emptyTitle: 'No waiting conversations', emptyDescription: 'Conversations awaiting response will appear here' },
    { value: 'resolved' as const, label: 'Resolved', emptyTitle: 'No resolved conversations', emptyDescription: 'Resolved conversations will appear here' },
    { value: 'human_requested' as const, label: humanRequestedCount > 0 ? `🚨 Human (${humanRequestedCount})` : '🚨 Human', emptyTitle: 'No human requests', emptyDescription: 'Conversations where users requested human assistance will appear here' },
  ];

  return (
    <Tabs value={activeTab} onValueChange={(val) => onTabChange(val as typeof activeTab)} defaultValue="all" className="flex h-full flex-col">
      <TabsList className="!w-full grid grid-cols-5" role="tablist" aria-label="Filter conversations by status">
        {tabConfigs.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
        ))}
      </TabsList>
      {tabConfigs.map(({ value, emptyTitle, emptyDescription }) => (
        <TabsContent key={value} value={value} className="flex-1 mt-0">
          <ConversationListWithPagination
            conversations={conversations}
            loading={loading}
            searchTerm={searchTerm}
            selectedId={selectedId}
            onSelect={onSelect}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
