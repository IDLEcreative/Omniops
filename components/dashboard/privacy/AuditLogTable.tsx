"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuditLogRow } from "./AuditLogRow";
import type { AuditEntry } from "@/types/privacy";
import { AUDIT_PAGE_SIZE } from "@/types/privacy";

interface AuditLogTableProps {
  auditEntries: AuditEntry[];
  auditCount: number;
  auditPage: number;
  auditLoading: boolean;
  auditError: string | null;
  auditOptionsError: string | null;
  auditExportError: string | null;
  onPageChange: (page: number) => void;
  onEntryClick: (entry: AuditEntry) => void;
}

export function AuditLogTable({
  auditEntries,
  auditCount,
  auditPage,
  auditLoading,
  auditError,
  auditOptionsError,
  auditExportError,
  onPageChange,
  onEntryClick,
}: AuditLogTableProps) {
  const auditStart = auditEntries.length === 0 ? 0 : auditPage * AUDIT_PAGE_SIZE + 1;
  const auditEnd = auditEntries.length === 0 ? 0 : auditStart + auditEntries.length - 1;

  return (
    <div className="space-y-4">
      {auditOptionsError && (
        <Alert variant="destructive">
          <AlertDescription>{auditOptionsError}</AlertDescription>
        </Alert>
      )}

      {auditExportError && (
        <Alert variant="destructive">
          <AlertDescription>{auditExportError}</AlertDescription>
        </Alert>
      )}

      {auditError && (
        <Alert variant="destructive">
          <AlertDescription>{auditError}</AlertDescription>
        </Alert>
      )}

      {auditLoading ? (
        <p className="text-sm text-muted-foreground">Loading audit entries…</p>
      ) : auditEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No audit entries found for the selected filters.</p>
      ) : (
        <div className="space-y-4">
          {auditEntries.map((entry) => (
            <AuditLogRow
              key={entry.id}
              entry={entry}
              onClick={() => onEntryClick(entry)}
            />
          ))}
        </div>
      )}

      {auditEntries.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {auditStart}-{auditEnd} of {auditCount} entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(auditPage - 1, 0))}
              disabled={auditPage === 0 || auditLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(auditPage + 1)}
              disabled={(auditPage + 1) * AUDIT_PAGE_SIZE >= auditCount || auditLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
