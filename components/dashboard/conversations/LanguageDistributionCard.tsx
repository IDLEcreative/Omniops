import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Globe } from "lucide-react";
import { SkeletonList } from "./SkeletonList";

interface LanguageEntry {
  language: string;
  percentage: number;
}

interface LanguageDistributionCardProps {
  languages: LanguageEntry[];
  loading: boolean;
}

export function LanguageDistributionCard({ languages, loading }: LanguageDistributionCardProps) {
  return (
    <Card className="lg:col-span-4 border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardDescription className="text-xs uppercase tracking-wider font-medium">
          Language Distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {loading ? (
          <SkeletonList count={4} />
        ) : languages.length > 0 ? (
          languages.map((entry, index) => (
            <div key={entry.language} className="flex items-center justify-between text-sm group">
              <div className="flex items-center gap-2.5">
                <div className={`w-1 h-6 rounded-full ${
                  index === 0 ? 'bg-purple-500' :
                  index === 1 ? 'bg-purple-400' :
                  index === 2 ? 'bg-purple-300' :
                  'bg-purple-200'
                }`} />
                <span className="font-medium text-foreground">{entry.language}</span>
              </div>
              <span className="font-semibold tabular-nums text-muted-foreground">{entry.percentage}%</span>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Globe}
            title="No language data"
            description="Language diversity metrics will appear as international customers engage"
            variant="compact"
          />
        )}
      </CardContent>
    </Card>
  );
}
