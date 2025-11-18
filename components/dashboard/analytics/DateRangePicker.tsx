"use client";

import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange as DateRangeType } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRange, DateRangePreset } from "@/types/dashboard";

interface DateRangePickerProps {
  /**
   * Current date range
   */
  value?: DateRange;

  /**
   * Callback when date range changes
   */
  onChange: (range: DateRange) => void;

  /**
   * Optional className for styling
   */
  className?: string;

  /**
   * Minimum selectable date (default: 1 year ago)
   */
  minDate?: Date;

  /**
   * Maximum selectable date (default: today)
   */
  maxDate?: Date;

  /**
   * Maximum range in days (default: 365)
   */
  maxRangeDays?: number;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  minDate = subDays(new Date(), 365),
  maxDate = new Date(),
  maxRangeDays = 365,
}: DateRangePickerProps) {
  const [preset, setPreset] = useState<DateRangePreset>('7d');
  const [isOpen, setIsOpen] = useState(false);

  // Convert DateRange to react-day-picker DateRange format
  const calendarRange: DateRangeType | undefined = useMemo(() => {
    if (!value?.from) return undefined;
    return {
      from: value.from,
      to: value.to,
    };
  }, [value]);

  // Calculate date range from preset
  const getPresetRange = (presetValue: DateRangePreset): DateRange => {
    const now = new Date();

    switch (presetValue) {
      case '7d':
        return { from: subDays(now, 7), to: now };

      case '30d':
        return { from: subDays(now, 30), to: now };

      case '90d':
        return { from: subDays(now, 90), to: now };

      case 'custom':
      default:
        return value || { from: subDays(now, 7), to: now };
    }
  };

  // Handle preset selection
  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset);

    if (newPreset !== 'custom') {
      const range = getPresetRange(newPreset);
      onChange(range);
      setIsOpen(false);
    } else {
      // Open calendar for custom selection
      setIsOpen(true);
    }
  };

  // Handle calendar date selection
  const handleCalendarSelect = (range: DateRangeType | undefined) => {
    if (!range || !range.from || !range.to) {
      // Don't call onChange until we have a complete range
      return;
    }

    // Validate max range
    if (range.from && range.to) {
      const daysDiff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > maxRangeDays) {
        // Silently ignore - user is still selecting
        return;
      }
    }

    onChange({
      from: range.from,
      to: range.to,
    });

    // Auto-close when both dates selected
    if (range.from && range.to) {
      setPreset('custom');
      setIsOpen(false);
    }
  };

  // Format display text
  const getDisplayText = (): string => {
    if (!value?.from) {
      return "Select date range";
    }

    if (!value.to) {
      return format(value.from, "MMM d, yyyy");
    }

    return `${format(value.from, "MMM d, yyyy")} - ${format(value.to, "MMM d, yyyy")}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Preset Selector */}
      <Select value={preset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {/* Calendar Popover (shown when custom is selected) */}
      {preset === 'custom' && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !value?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {getDisplayText()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={calendarRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              defaultMonth={value?.from || subDays(new Date(), 30)}
              disabled={(date) =>
                date > maxDate || date < minDate
              }
              initialFocus
            />

            {/* Range info footer */}
            <div className="border-t p-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Max range: {maxRangeDays} days</span>
                {value?.from && value?.to && (
                  <span className="font-medium text-foreground">
                    {Math.ceil((value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
