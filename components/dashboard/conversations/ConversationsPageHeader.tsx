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
    <div className="space-y-2">
      {/* Combined Title and Controls Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor live conversations and customer engagement
          </p>
        </div>
      </div>

      {/* Controls Section - Better organized with visual grouping */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View Toggle */}
        <Tabs value={mainView} onValueChange={(val) => onMainViewChange(val as MainView)}>
          <TabsList className="h-9">
            <TabsTrigger value="conversations" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Conversations</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Separator */}
        <div className="h-6 w-px bg-border hidden md:block" />

        {/* Date Range Selector */}
        <Select value={selectedRange} onValueChange={(value) => onRangeChange(value as DateRangeValue)}>
          <SelectTrigger className="w-[160px] h-9">
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

        {/* Live Status */}
        <LiveStatusIndicator
          isLive={isLive}
          onToggle={onToggleLive}
          lastFetchTime={lastFetch ? lastFetch.getTime() : Date.now()}
          newCount={newCount}
          onAcknowledge={onAcknowledgeNew}
        />

        {/* Spacer to push action buttons to the right on larger screens */}
        <div className="flex-1 min-w-0 hidden lg:block" />

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={loading || refreshing}
            aria-label="Refresh conversations"
            aria-busy={refreshing}
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant={selectionMode ? "default" : "outline"}
            size="icon"
            onClick={onToggleSelectionMode}
            aria-label={selectionMode ? "Exit selection mode" : "Enter selection mode"}
            title={selectionMode ? "Exit selection mode" : "Select multiple conversations"}
            className="h-9 w-9"
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
    </div>
  );
}
