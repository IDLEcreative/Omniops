import type { ComponentProps } from "react";
import React, { useState, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { toast } from "sonner";

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

interface ConversationHeaderProps {
  conversation: {
    id: string;
    customerName: string | null;
    status: "active" | "waiting" | "resolved";
    timestamp: string;
  };
  onActionComplete?: () => void;
}

// Performance: Memoized to prevent re-renders when parent updates
// but props remain unchanged. Event handlers use useCallback to
// maintain stable references and prevent cascade re-renders.
function ConversationHeaderComponent({ conversation, onActionComplete }: ConversationHeaderProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleAssign = useCallback(async () => {
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/dashboard/conversations/${conversation.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_human' }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Assigned to human agent');
        onActionComplete?.();
      } else {
        toast.error(`Failed to assign: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[ConversationHeader] Assign error:', error);
      toast.error('Failed to assign conversation');
    } finally {
      setIsAssigning(false);
    }
  }, [conversation.id, onActionComplete]);

  const handleClose = useCallback(async () => {
    if (!confirm('Are you sure you want to close this conversation? This action will mark it as resolved.')) {
      return;
    }

    setIsClosing(true);
    try {
      const res = await fetch(`/api/dashboard/conversations/${conversation.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Conversation closed successfully');
        onActionComplete?.();
      } else {
        toast.error(`Failed to close: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[ConversationHeader] Close error:', error);
      toast.error('Failed to close conversation');
    } finally {
      setIsClosing(false);
    }
  }, [conversation.id, onActionComplete]);

  return (
    <div className="border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>
              {(conversation.customerName?.charAt(0) ?? "C").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">
                {conversation.customerName ?? "Customer"}
              </h3>
              <Badge variant={statusBadgeVariant(conversation.status)}>
                {STATUS_LABELS[conversation.status]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Last message {formatRelativeTime(conversation.timestamp)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAssign}
            disabled={isAssigning || isClosing || conversation.status === 'resolved'}
            aria-label="Assign to human agent"
            aria-busy={isAssigning}
          >
            {isAssigning ? 'Assigning...' : 'Assign Human'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isAssigning || isClosing || conversation.status === 'resolved'}
            aria-label="Close conversation"
            aria-busy={isClosing}
          >
            {isClosing ? 'Closing...' : 'Close'}
          </Button>
          <Button variant="ghost" size="icon" aria-label="View bot information">
            <Bot className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export const ConversationHeader = React.memo(ConversationHeaderComponent);
