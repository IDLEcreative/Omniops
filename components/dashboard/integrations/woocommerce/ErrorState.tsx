import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onBack: () => void;
  onConfigure: () => void;
  onRetry: () => void;
}

export function ErrorState({ error, onBack, onConfigure, onRetry }: ErrorStateProps) {
  const needsConfiguration = error.includes('not configured');

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Integrations
        </Button>
      </div>

      <Alert className="mb-4 border-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>

      <div className="flex gap-2">
        {needsConfiguration ? (
          <Button onClick={onConfigure} className="gap-2">
            Configure WooCommerce
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
