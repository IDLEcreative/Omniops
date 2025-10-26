"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { AuditEntry } from "@/types/privacy";

interface AuditLogRowProps {
  entry: AuditEntry;
  onClick: () => void;
}

export function AuditLogRow({ entry, onClick }: AuditLogRowProps) {
  return (
    <div
      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant={entry.request_type === 'export' ? 'secondary' : 'destructive'}>
            {entry.request_type === 'export' ? 'Export' : 'Delete'}
          </Badge>
          <Badge
            variant={
              entry.status === 'completed'
                ? 'default'
                : entry.status === 'pending'
                ? 'secondary'
                : 'destructive'
            }
          >
            {entry.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(entry.created_at).toLocaleString()}
          </span>
        </div>
        <p className="text-sm font-medium">
          {entry.message ?? 'Processed GDPR request'}
        </p>
        <p className="text-xs text-muted-foreground">
          Actor: {entry.actor ?? 'Dashboard'} • Domain: {entry.domain}
        </p>
        <p className="text-xs text-muted-foreground">
          Identifier: {entry.email ?? entry.session_id ?? 'Unspecified'}
        </p>
        {typeof entry.deleted_count === 'number' && entry.request_type === 'delete' && (
          <p className="text-xs text-muted-foreground">
            Deleted conversations: {entry.deleted_count}
          </p>
        )}
      </div>
      <Button variant="ghost" size="sm" className="ml-2">
        <Eye className="h-4 w-4" />
      </Button>
    </div>
  );
}
