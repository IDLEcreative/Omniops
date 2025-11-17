"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import type { AdvancedFilterState } from "../AdvancedFilters";

interface NewFiltersProps {
  sentiment?: string;
  domainId?: string;
  customerEmail?: string;
  domains: Array<{ id: string; name: string }>;
  onSentimentChange: (value: string) => void;
  onDomainChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onEmailClear: () => void;
}

export function NewFilters({
  sentiment,
  domainId,
  customerEmail,
  domains,
  onSentimentChange,
  onDomainChange,
  onEmailChange,
  onEmailClear,
}: NewFiltersProps) {
  return (
    <>
      {/* Sentiment Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sentiment</Label>
        <Select value={sentiment || ''} onValueChange={onSentimentChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All sentiments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All sentiments</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Domain Filter */}
      {domains.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Domain</Label>
          <Select value={domainId || ''} onValueChange={onDomainChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All domains</SelectItem>
              {domains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Customer Email Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Customer Email</Label>
        <div className="relative">
          <Input
            type="email"
            placeholder="Filter by email"
            className="h-9 pr-8"
            value={customerEmail || ''}
            onChange={(e) => onEmailChange(e.target.value)}
          />
          {customerEmail && (
            <button
              type="button"
              onClick={onEmailClear}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
