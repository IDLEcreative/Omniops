'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConversationPreview } from './ConversationPreview';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface SearchResultsProps {
  results: any[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SearchResults({
  results,
  loading,
  currentPage,
  totalPages,
  onPageChange
}: SearchResultsProps) {
  if (loading) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Searching conversations...</p>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <svg
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <div className="text-center">
            <h3 className="font-medium text-lg">No results found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Try adjusting your search query or filters
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Group results by conversation
  const conversationGroups = new Map<string, typeof results>();
  results.forEach(result => {
    const group = conversationGroups.get(result.conversationId) || [];
    group.push(result);
    conversationGroups.set(result.conversationId, group);
  });

  return (
    <div className="space-y-4">
      {/* Results */}
      <div className="space-y-3">
        {Array.from(conversationGroups.entries()).map(([conversationId, messages]) => (
          <ConversationPreview
            key={conversationId}
            conversationId={conversationId}
            messages={messages}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}