"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { exportAnalyticsToCSV } from "@/lib/analytics/export-csv";
import { exportAnalyticsToPDF } from "@/lib/analytics/export-pdf";
import type { DashboardAnalyticsData } from "@/types/dashboard";

interface ExportButtonProps {
  data?: DashboardAnalyticsData;
  dateRange?: { start: string; end: string };
  chartRefs?: React.RefObject<HTMLElement[]>;
}

export function ExportButton({ data, dateRange, chartRefs }: ExportButtonProps) {
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const handleCSVExport = async () => {
    if (!data) {
      // Fallback: download via API
      const params = new URLSearchParams({
        days: '30',
      });
      if (dateRange) {
        params.set('startDate', dateRange.start);
        params.set('endDate', dateRange.end);
      }

      setExporting('csv');
      try {
        const response = await fetch(`/api/analytics/export/csv?${params.toString()}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('CSV export failed:', error);
      } finally {
        setExporting(null);
      }
      return;
    }

    const range = dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    };

    setExporting('csv');
    try {
      exportAnalyticsToCSV(data, range);
    } finally {
      setExporting(null);
    }
  };

  const handlePDFExport = async () => {
    if (!data) {
      // Fallback: download via API
      const params = new URLSearchParams({
        days: '30',
      });
      if (dateRange) {
        params.set('startDate', dateRange.start);
        params.set('endDate', dateRange.end);
      }

      setExporting('pdf');
      try {
        const response = await fetch(`/api/analytics/export/pdf?${params.toString()}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${Date.now()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('PDF export failed:', error);
      } finally {
        setExporting(null);
      }
      return;
    }

    const range = dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    };

    const charts = chartRefs?.current || [];

    setExporting('pdf');
    try {
      await exportAnalyticsToPDF(data, range, charts, { includeCharts: charts.length > 0 });
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!!exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? `Exporting ${exporting.toUpperCase()}...` : 'Export'}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCSVExport} disabled={!!exporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDFExport} disabled={!!exporting}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
