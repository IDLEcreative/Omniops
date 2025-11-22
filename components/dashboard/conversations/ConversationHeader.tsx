import type { ComponentProps } from "react";
import React, { useState, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, AlertCircle } from "lucide-react";
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
    metadata?: {
      assigned_to_human?: boolean;
      requested_human_at?: string;
      frustration_detected?: boolean;
      frustration_reason?: string;
      human_request_reason?: string;
    };
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

  const { metadata } = conversation;
  const showFrustrationContext = metadata?.frustration_detected || metadata?.assigned_to_human;

  return (
    <div className="border-b">
      <div className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {(conversation.customerName?.charAt(0) ?? "C").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm">
                  {conversation.customerName ?? "Customer"}
                </h3>
                <Badge variant={statusBadgeVariant(conversation.status)} className="text-xs">
                  {STATUS_LABELS[conversation.status]}
                </Badge>
                {metadata?.assigned_to_human && (
                  <Badge variant="destructive" className="text-xs">
                    👤 Human Requested
                  </Badge>
                )}
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

      {/* Frustration Context Alert */}
      {showFrustrationContext && (
        <div className="px-2 pb-2">
          <Alert variant={metadata.frustration_detected ? "destructive" : "default"} className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {metadata.frustration_detected && metadata.frustration_reason && (
                <div className="mb-1">
                  <strong className="font-semibold">⚠️ Customer Frustration Detected:</strong>
                  <p className="mt-0.5">{metadata.frustration_reason}</p>
                </div>
              )}
              {metadata.assigned_to_human && metadata.requested_human_at && (
                <div className={metadata.frustration_detected ? "mt-2 pt-2 border-t" : ""}>
                  <strong className="font-semibold">🙋 Human Help Requested:</strong>
                  <p className="mt-0.5">
                    {formatRelativeTime(metadata.requested_human_at)}
                    {metadata.human_request_reason && ` - ${metadata.human_request_reason}`}
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

export const ConversationHeader = React.memo(ConversationHeaderComponent);
