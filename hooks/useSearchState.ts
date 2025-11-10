import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for managing conversation search state
 * Handles search execution, pagination, and filter management
 */

interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  domainId?: string;
  customerEmail?: string;
}

interface SearchState {
  query: string;
  filters: SearchFilters;
  results: any[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  executionTime?: number;
}

export function useSearchState() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    filters: {},
    results: [],
    loading: false,
    totalCount: 0,
    currentPage: 1,
    totalPages: 0
  });

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

  const handleFilterChange = useCallback((filters: SearchFilters) => {
    setSearchState(prev => ({ ...prev, filters }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    handleSearch(searchState.query, page);
  }, [searchState.query, handleSearch]);

  return {
    searchState,
    handleSearch,
    handleFilterChange,
    handlePageChange
  };
}
