import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AdvancedFilters, type AdvancedFilterState } from "./AdvancedFilters";
import { RefObject } from "react";

interface SearchAndFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  availableLanguages: string[];
  currentFilters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  activeFilterCount: number;
}

export function SearchAndFiltersBar({
  searchTerm,
  onSearchChange,
  searchInputRef,
  availableLanguages,
  currentFilters,
  onFiltersChange,
  activeFilterCount,
}: SearchAndFiltersBarProps) {
  return (
    <div className="p-2 border-b flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={searchInputRef}
          className="pl-8 h-9"
          placeholder="Search conversations… (Press / to focus)"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search conversations by message content or customer name"
        />
      </div>
      <AdvancedFilters
        availableLanguages={availableLanguages}
        currentFilters={currentFilters}
        onFiltersChange={onFiltersChange}
        activeFilterCount={activeFilterCount}
      />
    </div>
  );
}
