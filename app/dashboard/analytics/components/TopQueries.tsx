/**
 * Top Queries Component
 *
 * Displays top user queries with frequency
 */

interface TopQueriesProps {
  queries: Array<{
    query: string;
    count: number;
    percentage: number;
  }>;
}

export function TopQueries({ queries }: TopQueriesProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Top User Queries</h3>
      <div className="space-y-2">
        {queries.slice(0, 5).map((query, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-3 bg-muted rounded-lg"
          >
            <span className="text-sm">{query.query}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {query.count} times
              </span>
              <span className="text-xs font-medium">
                {query.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
