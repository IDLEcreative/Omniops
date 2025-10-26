"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

interface IntegrationsSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function IntegrationsSearchBar({ searchQuery, onSearchChange }: IntegrationsSearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Request Integration
      </Button>
    </div>
  );
}
