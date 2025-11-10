'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function ConversationSearchBar({
  onSearch,
  loading = false,
  placeholder = 'Search conversations...'
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{
    term: string;
    count: number;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch search suggestions
  const fetchSuggestions = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(`/api/search/conversations?q=${encodeURIComponent(searchTerm)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  // Handle search submission
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    setShowSuggestions(false);
    onSearch(term);
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to clear
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="pl-10 pr-24"
            disabled={loading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!query.trim() || loading}
              className="h-7"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Search suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full mt-1 w-full bg-background border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-muted flex justify-between items-center"
              onClick={() => handleSuggestionClick(suggestion.term)}
            >
              <span className="flex items-center gap-2">
                <Search className="h-3 w-3 text-muted-foreground" />
                {suggestion.term}
              </span>
              <span className="text-xs text-muted-foreground">
                {suggestion.count} searches
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {!query && (
        <p className="text-xs text-muted-foreground mt-1">
          Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">⌘K</kbd> to focus
        </p>
      )}
    </div>
  );
}