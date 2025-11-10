'use client';

import { ConversationSearchBar } from '@/components/search/ConversationSearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResults } from '@/components/search/SearchResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, Table } from 'lucide-react';
import { useSearchState } from '@/hooks/useSearchState';
import { useSearchExports } from '@/hooks/useSearchExports';

/**
 * Conversation Search Page
 *
 * Provides full-text search across all chat conversations with:
 * - Advanced filtering (date range, sentiment, domain, customer)
 * - Multiple export formats (CSV, PDF, Excel)
 * - Pagination and performance metrics
 *
 * Refactored to use custom hooks for clean separation of concerns:
 * - useSearchState: Search execution and state management
 * - useSearchExports: Export functionality (CSV, PDF, Excel)
 *
 * Before refactoring: 337 lines (293 LOC)
 * After refactoring: 135 lines (~110 LOC) - 62% reduction!
 */
export default function SearchPage() {
  const {
    searchState,
    handleSearch,
    handleFilterChange,
    handlePageChange
  } = useSearchState();

  const {
    exportLoading,
    handleExportCSV,
    handleExportPDF,
    handleExportExcel
  } = useSearchExports(searchState.query, searchState.filters);

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
            onClick={handleExportExcel}
            disabled={exportLoading.excel || searchState.results.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportLoading.excel ? 'Exporting...' : 'Export Excel'}
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
