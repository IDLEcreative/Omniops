"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  dateRange: { start: string; end: string } | null;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onQuickDateRange: (days: number) => void;
}

export function DateRangeFilter({
  dateRange,
  onDateFromChange,
  onDateToChange,
  onQuickDateRange,
}: DateRangeFilterProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Date Range</Label>
      <div className="space-y-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateRange?.start && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.start ? format(new Date(dateRange.start), 'PP') : 'From date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange?.start ? new Date(dateRange.start) : undefined}
              onSelect={onDateFromChange}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateRange?.end && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.end ? format(new Date(dateRange.end), 'PP') : 'To date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange?.end ? new Date(dateRange.end) : undefined}
              onSelect={onDateToChange}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick date range buttons */}
      <div className="grid grid-cols-3 gap-1">
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onQuickDateRange(7)}>
          7 days
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onQuickDateRange(30)}>
          30 days
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onQuickDateRange(90)}>
          90 days
        </Button>
      </div>
    </div>
  );
}
