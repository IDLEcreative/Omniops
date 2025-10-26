"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditFilterType } from "@/types/privacy";

interface AuditLogFiltersProps {
  auditDomain: string;
  auditActor: string;
  auditStartDate: string;
  auditEndDate: string;
  auditFilter: AuditFilterType;
  availableAuditDomains: string[];
  availableAuditActors: string[];
  auditOptionsLoading: boolean;
  auditExportLoading: boolean;
  auditLoading: boolean;
  onDomainChange: (domain: string) => void;
  onActorChange: (actor: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onFilterChange: (filter: AuditFilterType) => void;
  onSyncFilters: () => void;
  onExport: () => void;
  onRefresh: () => void;
}

export function AuditLogFilters({
  auditDomain,
  auditActor,
  auditStartDate,
  auditEndDate,
  auditFilter,
  availableAuditDomains,
  availableAuditActors,
  auditOptionsLoading,
  auditExportLoading,
  auditLoading,
  onDomainChange,
  onActorChange,
  onStartDateChange,
  onEndDateChange,
  onFilterChange,
  onSyncFilters,
  onExport,
  onRefresh,
}: AuditLogFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="audit-domain">Domain</Label>
          <Select
            value={auditDomain || 'all'}
            onValueChange={(value) => {
              const nextDomain = value === 'all' ? '' : value;
              onDomainChange(nextDomain);
            }}
          >
            <SelectTrigger id="audit-domain" disabled={auditOptionsLoading}>
              <SelectValue placeholder={auditOptionsLoading ? 'Loading domains…' : 'All domains'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              {availableAuditDomains.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-actor">Actor</Label>
          <Select
            value={auditActor || 'all'}
            onValueChange={(value) => {
              const nextActor = value === 'all' ? '' : value;
              onActorChange(nextActor);
            }}
          >
            <SelectTrigger id="audit-actor" disabled={auditOptionsLoading}>
              <SelectValue placeholder={auditOptionsLoading ? 'Loading actors…' : 'All actors'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actors</SelectItem>
              {availableAuditActors.map((actor) => (
                <SelectItem key={actor} value={actor}>
                  {actor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="audit-start-date">Start date</Label>
          <Input
            id="audit-start-date"
            type="date"
            value={auditStartDate}
            max={auditEndDate || undefined}
            onChange={(event) => onStartDateChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-end-date">End date</Label>
          <Input
            id="audit-end-date"
            type="date"
            value={auditEndDate}
            min={auditStartDate || undefined}
            onChange={(event) => onEndDateChange(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Label>Filter</Label>
          <div className="flex gap-2">
            {(['all', 'export', 'delete'] as const).map((option) => (
              <Button
                key={option}
                type="button"
                variant={auditFilter === option ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange(option)}
              >
                {option === 'all' ? 'All' : option === 'export' ? 'Exports' : 'Deletions'}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSyncFilters} disabled={auditOptionsLoading}>
            Sync filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={auditExportLoading}
          >
            {auditExportLoading ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={auditLoading}>
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
