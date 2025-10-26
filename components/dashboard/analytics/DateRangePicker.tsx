"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, RefreshCw } from "lucide-react";

export type DateRangeValue = "24h" | "7d" | "30d" | "90d" | "custom";

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  onRefresh,
  isRefreshing,
  isLoading,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center space-x-3">
      <Select value={value} onValueChange={(v) => onChange(v as DateRangeValue)}>
        <SelectTrigger className="w-40">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">Last 24 hours</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="custom">Custom (30 days)</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading || isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
