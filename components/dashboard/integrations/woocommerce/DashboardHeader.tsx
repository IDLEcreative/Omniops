import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";

interface DashboardHeaderProps {
  isCached: boolean;
  cachedAt: string | null;
  isRefreshing: boolean;
  onBack: () => void;
  onRefresh: () => void;
}

const formatCacheTime = (cachedAt: string) => {
  const cached = new Date(cachedAt);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - cached.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

export function DashboardHeader({
  isCached,
  cachedAt,
  isRefreshing,
  onBack,
  onRefresh
}: DashboardHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">WooCommerce Analytics</h1>
            <p className="text-sm text-muted-foreground">
              What matters for your business today
              {isCached && cachedAt && (
                <span className="ml-2 text-xs">
                  (Cached {formatCacheTime(cachedAt)})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCached && (
            <Badge variant="secondary" className="text-xs">
              <RefreshCw className="mr-1 h-2.5 w-2.5" />
              Cached
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3 w-3" />
            )}
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
