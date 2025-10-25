import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { ComponentProps } from "react";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const STATUS_LABELS: Record<"active" | "waiting" | "resolved", string> = {
  active: "Active",
  waiting: "Waiting",
  resolved: "Resolved",
};

function statusBadgeVariant(status: "active" | "waiting" | "resolved"): BadgeVariant {
  switch (status) {
    case "resolved":
      return "outline";
    case "waiting":
      return "secondary";
    default:
      return "default";
  }
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const delta = Date.now() - date.getTime();
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

interface ConversationListItemProps {
  conversation: {
    id: string;
    timestamp: string;
    status: "active" | "waiting" | "resolved";
    customerName: string | null;
    message: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  isSelectionMode?: boolean;
  isChecked?: boolean;
  onToggleSelect?: () => void;
}

export function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
  isSelectionMode = false,
  isChecked = false,
  onToggleSelect,
}: ConversationListItemProps) {
  const handleClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onSelect();
    }
  };

  return (
    <button
      type="button"
      className={`w-full border-b px-4 py-3 text-left transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        isSelected ? "bg-muted border-l-2 border-l-primary" : ""
      }`}
      onClick={handleClick}
      aria-selected={isSelected}
      aria-label={`Conversation with ${conversation.customerName || "customer"}, ${formatRelativeTime(conversation.timestamp)}, status: ${STATUS_LABELS[conversation.status]}`}
    >
      <div className="flex items-start gap-3">
        {isSelectionMode && onToggleSelect && (
          <div className="pt-0.5">
            <Checkbox
              checked={isChecked}
              onCheckedChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select conversation with ${conversation.customerName || "customer"}`}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatRelativeTime(conversation.timestamp)}</span>
            <Badge variant={statusBadgeVariant(conversation.status)}>
              {STATUS_LABELS[conversation.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm font-medium">
            {conversation.customerName ?? "Customer"}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {conversation.message}
          </p>
        </div>
      </div>
    </button>
  );
}
