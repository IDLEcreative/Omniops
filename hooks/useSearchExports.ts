import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for managing search result exports (CSV, PDF, Excel)
 * Provides handlers and loading states for all export formats
 */

interface ExportLoadingState {
  csv: boolean;
  pdf: boolean;
  excel: boolean;
}

interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  domainId?: string;
  customerEmail?: string;
}

export function useSearchExports(searchQuery: string, searchFilters: SearchFilters) {
  const [exportLoading, setExportLoading] = useState<ExportLoadingState>({
    csv: false,
    pdf: false,
    excel: false
  });

  const downloadFile = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const handleExportCSV = useCallback(async () => {
    if (!searchQuery) {
      toast.error('No search results to export');
      return;
    }

    setExportLoading(prev => ({ ...prev, csv: true }));

    try {
      const response = await fetch('/api/search/export/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          filters: searchFilters
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      downloadFile(blob, `search-export-${new Date().toISOString()}.csv`);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExportLoading(prev => ({ ...prev, csv: false }));
    }
  }, [searchQuery, searchFilters, downloadFile]);

  const handleExportPDF = useCallback(async () => {
    if (!searchQuery) {
      toast.error('No search results to export');
      return;
    }

    setExportLoading(prev => ({ ...prev, pdf: true }));

    try {
      const response = await fetch('/api/search/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          filters: searchFilters
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      downloadFile(blob, `search-results-${new Date().toISOString()}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExportLoading(prev => ({ ...prev, pdf: false }));
    }
  }, [searchQuery, searchFilters, downloadFile]);

  const handleExportExcel = useCallback(async () => {
    if (!searchQuery) {
      toast.error('No search results to export');
      return;
    }

    setExportLoading(prev => ({ ...prev, excel: true }));

    try {
      const response = await fetch('/api/search/export/excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          filters: searchFilters,
          includeMetadata: true
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      downloadFile(blob, `search-export-${new Date().toISOString()}.xlsx`);
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Excel export failed. Please try again.');
    } finally {
      setExportLoading(prev => ({ ...prev, excel: false }));
    }
  }, [searchQuery, searchFilters, downloadFile]);

  return {
    exportLoading,
    handleExportCSV,
    handleExportPDF,
    handleExportExcel
  };
}
