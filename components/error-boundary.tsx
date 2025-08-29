"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;
    const newErrorCount = timeSinceLastError < 5000 ? this.state.errorCount + 1 : 1;
    
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
      console.error("Error count:", newErrorCount);
    }

    // Log to external service
    this.logErrorToService(error, errorInfo, newErrorCount);

    this.setState({
      error,
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now
    });
    
    // If too many errors in short time, suggest reload
    if (newErrorCount > 3) {
      console.error("Multiple errors detected in short succession");
    }
  }
  
  private async logErrorToService(error: Error, errorInfo: React.ErrorInfo, errorCount: number) {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorCount,
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          severity: errorCount > 2 ? 'critical' : 'high',
          category: 'react_component'
        }),
      });
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    });
    // Only reload if multiple errors occurred
    if (this.state.errorCount > 2) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const isDevelopment = process.env.NODE_ENV === "development";

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <CardTitle className="text-2xl">Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. We apologize for the inconvenience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className="mt-2">
                  <code className="text-sm bg-muted p-2 rounded block overflow-x-auto">
                    {this.state.error?.message || "Unknown error"}
                  </code>
                </AlertDescription>
              </Alert>

              {this.state.errorCount > 2 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Multiple Errors Detected</AlertTitle>
                  <AlertDescription>
                    The application has encountered {this.state.errorCount} errors. 
                    A full page reload is recommended.
                  </AlertDescription>
                </Alert>
              )}
              
              {isDevelopment && this.state.errorInfo && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Stack Trace (Development Only)
                  </h3>
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-64 overflow-y-auto">
                    {this.state.error?.stack}
                  </pre>
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Component Stack</summary>
                    <pre className="mt-2 bg-muted p-4 rounded overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = "/"}
                  variant="outline"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", error);
      if (errorInfo) {
        console.error("Error Info:", errorInfo);
      }
    }
    throw error;
  };
}