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
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Language Distribution</CardTitle>
        <CardDescription>Share of conversations by language</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <SkeletonList count={4} />
        ) : languages.length > 0 ? (
          languages.map((entry) => (
            <div key={entry.language} className="flex items-center justify-between text-sm">
              <span>{entry.language}</span>
              <span className="font-medium">{entry.percentage}%</span>
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
