/**
 * Failed Searches Component
 *
 * Displays searches that failed to return results
 */

import { AlertCircle } from 'lucide-react';

interface FailedSearchesProps {
  searches: string[];
}

export function FailedSearches({ searches }: FailedSearchesProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-500" />
        Failed Searches
      </h3>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {searches.slice(0, 6).map((search, index) => (
          <div
            key={index}
            className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
          >
            <span className="text-sm">{search}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
