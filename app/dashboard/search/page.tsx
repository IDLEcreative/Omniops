'use client';

import { useState, useCallback, useEffect } from 'react';
import { ConversationSearchBar } from '@/components/search/ConversationSearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResults } from '@/components/search/SearchResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Table } from 'lucide-react';
import { toast } from 'sonner';

interface SearchState {
  query: string;
  filters: {
    dateFrom?: string;
    dateTo?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    domainId?: string;
    customerEmail?: string;
  };
  results: any[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  executionTime?: number;
}

export default function SearchPage() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    filters: {},
    results: [],
    loading: false,
    totalCount: 0,
    currentPage: 1,
    totalPages: 0
  });

  const [exportLoading, setExportLoading] = useState<{
    csv: boolean;
    pdf: boolean;
  }>({
    csv: false,
    pdf: false
  });

  // Perform search
  const handleSearch = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setSearchState(prev => ({ ...prev, loading: true, query }));

    try {
      const response = await fetch('/api/search/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          filters: searchState.filters,
          page,
          limit: 20
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();

      setSearchState(prev => ({
        ...prev,
        results: data.data.results,
        totalCount: data.data.pagination.totalCount,
        currentPage: data.data.pagination.page,
        totalPages: data.data.pagination.totalPages,
        executionTime: data.data.performance.executionTime,
        loading: false
      }));

      toast.success(`Found ${data.data.pagination.totalCount} results in ${Math.round(data.data.performance.executionTime)}ms`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      setSearchState(prev => ({ ...prev, loading: false }));
    }
  }, [searchState.filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((filters: SearchState['filters']) => {
    setSearchState(prev => ({ ...prev, filters }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    handleSearch(searchState.query, page);
  }, [searchState.query, handleSearch]);

  // Export to CSV
  const handleExportCSV = useCallback(async () => {
    if (!searchState.query) {
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
          query: searchState.query,
          filters: searchState.filters
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExportLoading(prev => ({ ...prev, csv: false }));
    }
  }, [searchState]);

  // Export to PDF
  const handleExportPDF = useCallback(async () => {
    if (!searchState.query) {
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
          query: searchState.query,
          filters: searchState.filters
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-results-${new Date().toISOString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExportLoading(prev => ({ ...prev, pdf: false }));
    }
  }, [searchState]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Conversation Search</h1>
          <p className="text-muted-foreground mt-1">
            Search through all chat conversations with advanced filters
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={exportLoading.csv || searchState.results.length === 0}
          >
            <Table className="w-4 h-4 mr-2" />
            {exportLoading.csv ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exportLoading.pdf || searchState.results.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            {exportLoading.pdf ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <ConversationSearchBar
            onSearch={query => handleSearch(query, 1)}
            loading={searchState.loading}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Filters */}
        <div className="col-span-3">
          <SearchFilters
            filters={searchState.filters}
            onChange={handleFilterChange}
          />
        </div>

        {/* Results */}
        <div className="col-span-9">
          {/* Search Stats */}
          {searchState.totalCount > 0 && (
            <Card className="mb-4">
              <CardContent className="py-3">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    Found <strong>{searchState.totalCount}</strong> results
                    {searchState.executionTime && (
                      <span className="text-muted-foreground ml-2">
                        ({Math.round(searchState.executionTime)}ms)
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    Page {searchState.currentPage} of {searchState.totalPages}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          <SearchResults
            results={searchState.results}
            loading={searchState.loading}
            currentPage={searchState.currentPage}
            totalPages={searchState.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}