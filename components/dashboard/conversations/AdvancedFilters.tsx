"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Filter } from "lucide-react";
import { DateRangeFilter } from "./filters/DateRangeFilter";
import { NewFilters } from "./filters/NewFilters";

export interface AdvancedFilterState {
  languages: string[];
  customerType: "all" | "new" | "returning";
  messageLength: "all" | "short" | "medium" | "long";
  dateRange: { start: string; end: string } | null;
  sentiment?: "positive" | "negative" | "neutral";
  domainId?: string;
  customerEmail?: string;
}

interface AdvancedFiltersProps {
  availableLanguages: string[];
  currentFilters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  activeFilterCount: number;
}

export function AdvancedFilters({
  availableLanguages,
  currentFilters,
  onFiltersChange,
  activeFilterCount,
}: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<AdvancedFilterState>(currentFilters);
  const [domains, setDomains] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        const response = await fetch('/api/domains');
        if (response.ok) {
          const data = await response.json();
          setDomains(data.domains || []);
        }
      } catch (error) {
        console.error('Failed to load domains:', error);
      }
    };
    loadDomains();
  }, []);

  const handleDateFromChange = (date: Date | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: date
        ? { start: date.toISOString(), end: prev.dateRange?.end || new Date().toISOString() }
        : null,
    }));
  };

  const handleDateToChange = (date: Date | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: prev.dateRange
        ? { start: prev.dateRange.start, end: date?.toISOString() || new Date().toISOString() }
        : date
        ? { start: new Date().toISOString(), end: date.toISOString() }
        : null,
    }));
  };

  const handleQuickDateRange = (days: number) => {
    const today = new Date();
    const start = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: { start: start.toISOString(), end: today.toISOString() },
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClearAll = () => {
    const clearedFilters: AdvancedFilterState = {
      languages: [],
      customerType: "all",
      messageLength: "all",
      dateRange: null,
      sentiment: undefined,
      domainId: undefined,
      customerEmail: undefined,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Filter conversations" className="relative">
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 max-w-md max-h-[600px] overflow-y-auto" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Advanced Filters</h4>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-auto p-1 text-xs">
                Clear all
              </Button>
            )}
          </div>

          <Separator />

          <DateRangeFilter
            dateRange={localFilters.dateRange}
            onDateFromChange={handleDateFromChange}
            onDateToChange={handleDateToChange}
            onQuickDateRange={handleQuickDateRange}
          />

          <Separator />

          <NewFilters
            sentiment={localFilters.sentiment}
            domainId={localFilters.domainId}
            customerEmail={localFilters.customerEmail}
            domains={domains}
            onSentimentChange={(value) =>
              setLocalFilters((prev) => ({
                ...prev,
                sentiment: value ? (value as 'positive' | 'negative' | 'neutral') : undefined,
              }))
            }
            onDomainChange={(value) =>
              setLocalFilters((prev) => ({ ...prev, domainId: value || undefined }))
            }
            onEmailChange={(value) =>
              setLocalFilters((prev) => ({ ...prev, customerEmail: value || undefined }))
            }
            onEmailClear={() =>
              setLocalFilters((prev) => ({ ...prev, customerEmail: undefined }))
            }
          />

          <Separator />

          {/* Language Filter */}
          {availableLanguages.length > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Language</Label>
                  {localFilters.languages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocalFilters((prev) => ({ ...prev, languages: [] }))}
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableLanguages.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${language}`}
                        checked={localFilters.languages.includes(language)}
                        onCheckedChange={() =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            languages: prev.languages.includes(language)
                              ? prev.languages.filter((l) => l !== language)
                              : [...prev.languages, language],
                          }))
                        }
                      />
                      <label htmlFor={`lang-${language}`} className="text-sm font-normal cursor-pointer select-none">
                        {language}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Customer Type Filter - Disabled for now */}
          <div className="space-y-2 opacity-50 cursor-not-allowed" title="Coming soon - requires API enhancement">
            <Label className="text-sm font-medium">Customer Type</Label>
            <RadioGroup
              value={localFilters.customerType}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, customerType: value as AdvancedFilterState["customerType"] }))
              }
              disabled
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="customer-all" disabled />
                <label htmlFor="customer-all" className="text-sm font-normal">All</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="customer-new" disabled />
                <label htmlFor="customer-new" className="text-sm font-normal">New customers</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="returning" id="customer-returning" disabled />
                <label htmlFor="customer-returning" className="text-sm font-normal">Returning customers</label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Message Length Filter - Disabled for now */}
          <div className="space-y-2 opacity-50 cursor-not-allowed" title="Coming soon - requires API enhancement">
            <Label className="text-sm font-medium">Message Count</Label>
            <RadioGroup
              value={localFilters.messageLength}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, messageLength: value as AdvancedFilterState["messageLength"] }))
              }
              disabled
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="length-all" disabled />
                <label htmlFor="length-all" className="text-sm font-normal">All</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="short" id="length-short" disabled />
                <label htmlFor="length-short" className="text-sm font-normal">Short (&lt; 5 messages)</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="length-medium" disabled />
                <label htmlFor="length-medium" className="text-sm font-normal">Medium (5-15 messages)</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="long" id="length-long" disabled />
                <label htmlFor="length-long" className="text-sm font-normal">Long (&gt; 15 messages)</label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <Button onClick={handleApply} className="w-full" size="sm">
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
