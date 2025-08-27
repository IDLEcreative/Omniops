'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error when the component mounts
    logger.error('Application error occurred', error, {
      digest: error.digest,
      pathname: window.location.pathname,
    });
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2">
              <code className="text-sm bg-muted p-3 rounded block overflow-x-auto">
                {error.message || 'An unknown error occurred'}
              </code>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </AlertDescription>
          </Alert>

          {isDevelopment && error.stack && (
            <details className="space-y-2">
              <summary className="cursor-pointer font-medium text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Stack Trace (Development Only)
              </summary>
              <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-64 overflow-y-auto mt-2">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={reset} size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          <div className="text-sm text-muted-foreground pt-4 border-t">
            <p>If this problem persists, please contact support with the error details above.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}