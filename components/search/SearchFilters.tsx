'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FiltersProps {
  filters: {
    dateFrom?: string;
    dateTo?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    domainId?: string;
    customerEmail?: string;
  };
  onChange: (filters: FiltersProps['filters']) => void;
}

export function SearchFilters({ filters, onChange }: FiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [domains, setDomains] = useState<Array<{ id: string; name: string }>>([]);

  // Load available domains
  useEffect(() => {
    loadDomains();
  }, []);

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

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = <K extends keyof typeof localFilters>(
    key: K,
    value: typeof localFilters[K]
  ) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onChange(updated);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const cleared = {};
    setLocalFilters(cleared);
    onChange(cleared);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(localFilters).some(v => v !== undefined && v !== '');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-7 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !localFilters.dateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateFrom
                    ? format(new Date(localFilters.dateFrom), 'PP')
                    : 'From date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined}
                  onSelect={(date) =>
                    handleFilterChange('dateFrom', date?.toISOString())
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !localFilters.dateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateTo
                    ? format(new Date(localFilters.dateTo), 'PP')
                    : 'To date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localFilters.dateTo ? new Date(localFilters.dateTo) : undefined}
                  onSelect={(date) =>
                    handleFilterChange('dateTo', date?.toISOString())
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Sentiment Filter */}
        <div className="space-y-2">
          <Label>Sentiment</Label>
          <Select
            value={localFilters.sentiment || ''}
            onValueChange={(value) =>
              handleFilterChange('sentiment', value as 'positive' | 'negative' | 'neutral' | undefined)
            }
          >
            <SelectTrigger>
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
            <Label>Domain</Label>
            <Select
              value={localFilters.domainId || ''}
              onValueChange={(value) => handleFilterChange('domainId', value || undefined)}
            >
              <SelectTrigger>
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

        {/* Customer Email */}
        <div className="space-y-2">
          <Label>Customer Email</Label>
          <div className="relative">
            <Input
              type="email"
              placeholder="Filter by email"
              value={localFilters.customerEmail || ''}
              onChange={(e) => handleFilterChange('customerEmail', e.target.value || undefined)}
            />
            {localFilters.customerEmail && (
              <button
                type="button"
                onClick={() => handleFilterChange('customerEmail', undefined)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-2">
          <Label>Quick Filters</Label>
          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                handleFilterChange('dateFrom', lastWeek.toISOString());
                handleFilterChange('dateTo', today.toISOString());
              }}
            >
              Last 7 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                handleFilterChange('dateFrom', lastMonth.toISOString());
                handleFilterChange('dateTo', today.toISOString());
              }}
            >
              Last 30 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => handleFilterChange('sentiment', 'negative')}
            >
              Negative sentiment only
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}