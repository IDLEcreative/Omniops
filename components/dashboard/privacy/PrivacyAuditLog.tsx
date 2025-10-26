"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Trash2 } from "lucide-react";
import { AuditDetailModal } from "@/components/ui/audit-detail-modal";
import { AuditLogFilters } from "./AuditLogFilters";
import { AuditLogTable } from "./AuditLogTable";
import { toDateISOString, downloadBlob } from "@/lib/dashboard/privacy-utils";
import type { AuditEntry, AuditFilterType } from "@/types/privacy";
import { AUDIT_PAGE_SIZE } from "@/types/privacy";

interface PrivacyAuditLogProps {
  onRefresh?: () => void;
}

export function PrivacyAuditLog({ onRefresh }: PrivacyAuditLogProps) {
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<AuditEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditCount, setAuditCount] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<AuditFilterType>('all');
  const [auditOptionsLoading, setAuditOptionsLoading] = useState(false);
  const [auditOptionsError, setAuditOptionsError] = useState<string | null>(null);
  const [availableAuditDomains, setAvailableAuditDomains] = useState<string[]>([]);
  const [availableAuditActors, setAvailableAuditActors] = useState<string[]>([]);
  const [auditDomain, setAuditDomain] = useState('');
  const [auditActor, setAuditActor] = useState('');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const [auditExportLoading, setAuditExportLoading] = useState(false);
  const [auditExportError, setAuditExportError] = useState<string | null>(null);

  const fetchAuditLog = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const params = new URLSearchParams();
      if (auditFilter !== 'all') {
        params.set('request_type', auditFilter);
      }
      if (auditDomain.trim()) {
        params.set('domain', auditDomain.trim());
      }
      if (auditActor.trim()) {
        params.set('actor', auditActor.trim());
      }
      const startIso = toDateISOString(auditStartDate, 'start');
      if (startIso) {
        params.set('start_date', startIso);
      }
      const endIso = toDateISOString(auditEndDate, 'end');
      if (endIso) {
        params.set('end_date', endIso);
      }
      params.set('limit', AUDIT_PAGE_SIZE.toString());
      params.set('offset', String(auditPage * AUDIT_PAGE_SIZE));

      const url = params.toString().length > 0 ? `/api/gdpr/audit?${params.toString()}` : '/api/gdpr/audit';
      const response = await fetch(url);
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? 'Failed to load audit log');
      }
      const payload = await response.json();
      setAuditEntries(payload.entries ?? []);
      setAuditCount(typeof payload.count === 'number' ? payload.count : (payload.entries ?? []).length);
    } catch (err) {
      setAuditError((err as Error).message);
      setAuditEntries([]);
      setAuditCount(0);
    } finally {
      setAuditLoading(false);
    }
  }, [auditFilter, auditDomain, auditActor, auditStartDate, auditEndDate, auditPage]);

  const fetchAuditOptions = useCallback(async () => {
    setAuditOptionsLoading(true);
    setAuditOptionsError(null);
    try {
      const response = await fetch('/api/gdpr/audit/options');
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? 'Failed to load audit filter options');
      }
      const payload = await response.json();
      setAvailableAuditDomains(Array.isArray(payload.domains) ? payload.domains : []);
      setAvailableAuditActors(Array.isArray(payload.actors) ? payload.actors : []);
    } catch (err) {
      setAuditOptionsError((err as Error).message);
      setAvailableAuditDomains([]);
      setAvailableAuditActors([]);
    } finally {
      setAuditOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  useEffect(() => {
    fetchAuditOptions();
  }, [fetchAuditOptions]);

  const handleAuditExport = useCallback(async () => {
    setAuditExportLoading(true);
    setAuditExportError(null);
    try {
      const params = new URLSearchParams();
      if (auditFilter !== 'all') {
        params.set('request_type', auditFilter);
      }
      if (auditDomain.trim()) {
        params.set('domain', auditDomain.trim());
      }
      if (auditActor.trim()) {
        params.set('actor', auditActor.trim());
      }
      const startIso = toDateISOString(auditStartDate, 'start');
      if (startIso) {
        params.set('start_date', startIso);
      }
      const endIso = toDateISOString(auditEndDate, 'end');
      if (endIso) {
        params.set('end_date', endIso);
      }
      params.set('format', 'csv');
      params.set('limit', '5000');

      const url = `/api/gdpr/audit?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        const maybeJson = await response.json().catch(() => null);
        const message = maybeJson && typeof maybeJson.error === 'string'
          ? maybeJson.error
          : 'Failed to export audit log.';
        throw new Error(message);
      }

      const blob = await response.blob();
      const filename = `gdpr-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(blob, filename);
    } catch (err) {
      setAuditExportError((err as Error).message);
    } finally {
      setAuditExportLoading(false);
    }
  }, [auditActor, auditDomain, auditEndDate, auditFilter, auditStartDate]);

  const handleDomainChange = (domain: string) => {
    setAuditDomain(domain);
    setAuditPage(0);
  };

  const handleActorChange = (actor: string) => {
    setAuditActor(actor);
    setAuditPage(0);
  };

  const handleStartDateChange = (date: string) => {
    setAuditStartDate(date);
    setAuditPage(0);
  };

  const handleEndDateChange = (date: string) => {
    setAuditEndDate(date);
    setAuditPage(0);
  };

  const handleFilterChange = (filter: AuditFilterType) => {
    setAuditFilter(filter);
    setAuditPage(0);
  };

  const handleEntryClick = (entry: AuditEntry) => {
    setSelectedAuditEntry(entry);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            GDPR Audit Log
          </CardTitle>
          <CardDescription>
            Export/delete history sourced from Supabase gdpr_audit_log
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AuditLogFilters
              auditDomain={auditDomain}
              auditActor={auditActor}
              auditStartDate={auditStartDate}
              auditEndDate={auditEndDate}
              auditFilter={auditFilter}
              availableAuditDomains={availableAuditDomains}
              availableAuditActors={availableAuditActors}
              auditOptionsLoading={auditOptionsLoading}
              auditExportLoading={auditExportLoading}
              auditLoading={auditLoading}
              onDomainChange={handleDomainChange}
              onActorChange={handleActorChange}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onFilterChange={handleFilterChange}
              onSyncFilters={fetchAuditOptions}
              onExport={handleAuditExport}
              onRefresh={fetchAuditLog}
            />

            <AuditLogTable
              auditEntries={auditEntries}
              auditCount={auditCount}
              auditPage={auditPage}
              auditLoading={auditLoading}
              auditError={auditError}
              auditOptionsError={auditOptionsError}
              auditExportError={auditExportError}
              onPageChange={setAuditPage}
              onEntryClick={handleEntryClick}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Subject Requests</CardTitle>
            <CardDescription>
              Manage user privacy requests quickly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>User Email or ID</Label>
              <Input placeholder="user@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Alerts</CardTitle>
            <CardDescription>
              Recent security events requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Failed login attempts</span>
                <Badge variant="outline">3 today</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Unusual IP access</span>
                <Badge variant="destructive">1 active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SSL certificate</span>
                <Badge className="bg-green-100 text-green-800">Valid</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AuditDetailModal
        entry={selectedAuditEntry}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAuditEntry(null);
        }}
      />
    </>
  );
}
