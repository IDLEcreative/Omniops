/**
 * Analytics Export Buttons Component
 *
 * Provides CSV, Excel, and PDF export functionality for analytics data.
 * Downloads files via /api/analytics/export endpoint with current time range.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ExportButtonsProps {
  /**
   * Number of days to include in export
   */
  days: number;

  /**
   * Optional className for styling
   */
  className?: string;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

export function ExportButtons({ days, className }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);

    try {
      console.log(`📥 Exporting analytics as ${format.toUpperCase()}...`);

      // Build export URL with parameters
      const url = `/api/analytics/export?format=${format}&days=${days}`;

      // Fetch the file
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(error.error || 'Failed to export analytics');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `analytics-${format}-${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);


      toast({
        title: 'Export successful',
        description: `Downloaded ${filename}`,
      });

    } catch (error) {
      console.error(`❌ Export failed:`, error);

      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Data'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
          <span className="ml-auto text-xs text-muted-foreground">
            {days} days
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
          <span className="ml-auto text-xs text-muted-foreground">
            {days} days
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          <File className="h-4 w-4 mr-2" />
          Export as PDF
          <span className="ml-auto text-xs text-muted-foreground">
            {days} days
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
