"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDialogProps {
  selectedIds?: string[];
  currentFilters?: {
    status?: 'all' | 'active' | 'waiting' | 'resolved';
    dateRange?: {
      start: string;
      end: string;
    };
    searchTerm?: string;
  };
}

export function ExportDialog({ selectedIds, currentFilters }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [exportFiltered, setExportFiltered] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const payload: {
        format: 'csv' | 'json';
        conversationIds?: string[];
        filters?: typeof currentFilters;
      } = {
        format,
      };

      // If specific conversations are selected, export only those
      if (selectedIds && selectedIds.length > 0) {
        payload.conversationIds = selectedIds;
      } else if (exportFiltered && currentFilters) {
        // Otherwise, apply current filters if user opted in
        payload.filters = currentFilters;
      }

      const response = await fetch('/api/dashboard/conversations/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `conversations-export.${format}`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Successfully exported ${format.toUpperCase()} file`);
      setOpen(false);
    } catch (error) {
      console.error('[ExportDialog] Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export conversations';
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const hasSelection = selectedIds && selectedIds.length > 0;
  const canApplyFilters = !hasSelection && currentFilters;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Conversations</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json')}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:border-primary transition-colors">
                <RadioGroupItem value="csv" id="csv" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="csv" className="cursor-pointer font-medium">
                    CSV (Excel Compatible)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Summary view with key metrics - perfect for spreadsheets
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:border-primary transition-colors">
                <RadioGroupItem value="json" id="json" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="json" className="cursor-pointer font-medium">
                    JSON (Complete Data)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Full conversation history with all messages and metadata
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Scope</Label>
            {hasSelection ? (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  Exporting <span className="font-semibold">{selectedIds.length}</span> selected conversation{selectedIds.length !== 1 ? 's' : ''}
                </p>
              </div>
            ) : canApplyFilters ? (
              <div className="flex items-start space-x-3 p-3 rounded-lg border">
                <Checkbox
                  id="filtered"
                  checked={exportFiltered}
                  onCheckedChange={(checked) => setExportFiltered(!!checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="filtered" className="cursor-pointer font-medium">
                    Export filtered results only
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Apply current status, date range, and search filters
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  Exporting all conversations (up to 1,000 most recent)
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
