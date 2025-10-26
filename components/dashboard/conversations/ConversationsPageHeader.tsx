import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, RefreshCw, CheckSquare, MessageCircle, BarChart3 } from "lucide-react";
import { LiveStatusIndicator } from "./LiveStatusIndicator";
import { ExportDialog } from "./ExportDialog";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

type DateRangeValue = "24h" | "7d" | "30d" | "90d";
type MainView = 'conversations' | 'analytics';

interface ConversationsPageHeaderProps {
  mainView: MainView;
  onMainViewChange: (view: MainView) => void;
  selectedRange: DateRangeValue;
  onRangeChange: (range: DateRangeValue) => void;
  isLive: boolean;
  onToggleLive: () => void;
  lastFetch: Date | null;
  newCount: number;
  onAcknowledgeNew: () => void;
  onRefresh: () => void;
  loading: boolean;
  refreshing: boolean;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedIds: Set<string>;
  activeTab: 'all' | 'active' | 'waiting' | 'resolved';
  dateRangeForExport: { start: string; end: string };
  searchTerm: string;
  displayShortcuts: Array<{ keys: string; description: string }>;
}

export function ConversationsPageHeader({
  mainView,
  onMainViewChange,
  selectedRange,
  onRangeChange,
  isLive,
  onToggleLive,
  lastFetch,
  newCount,
  onAcknowledgeNew,
  onRefresh,
  loading,
  refreshing,
  selectionMode,
  onToggleSelectionMode,
  selectedIds,
  activeTab,
  dateRangeForExport,
  searchTerm,
  displayShortcuts,
}: ConversationsPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-muted-foreground">
          Monitor live conversations, recent sentiment, and language coverage.
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <Tabs value={mainView} onValueChange={(val) => onMainViewChange(val as MainView)}>
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
        <Select value={selectedRange} onValueChange={(value) => onRangeChange(value as DateRangeValue)}>
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
          onToggle={onToggleLive}
          lastFetchTime={lastFetch ? lastFetch.getTime() : Date.now()}
          newCount={newCount}
          onAcknowledge={onAcknowledgeNew}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading || refreshing}
          aria-label="Refresh conversations"
          aria-busy={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
        <Button
          variant={selectionMode ? "default" : "outline"}
          size="icon"
          onClick={onToggleSelectionMode}
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
  );
}
