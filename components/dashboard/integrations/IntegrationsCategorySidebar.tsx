"use client";

import { Badge } from "@/components/ui/badge";

export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

interface IntegrationsCategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

export function IntegrationsCategorySidebar({
  categories,
  selectedCategory,
  onCategorySelect,
}: IntegrationsCategorySidebarProps) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
        Categories
      </h3>
      <div className="space-y-1">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              {category.icon}
              <span>{category.name}</span>
            </div>
            <Badge
              variant={selectedCategory === category.id ? "secondary" : "outline"}
              className="ml-auto"
            >
              {category.count}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
