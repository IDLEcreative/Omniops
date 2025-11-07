"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

interface VerificationCheck {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

interface VerificationResult {
  success: boolean;
  status: 'pass' | 'fail' | 'warning';
  serverUrl: string;
  domain: string;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
  checks: VerificationCheck[];
  totalDuration: number;
  timestamp: string;
}

interface Props {
  domain: string;
  onVerificationComplete: (passed: boolean, serverUrl: string) => void;
}

export function InstallationVerification({ domain, onVerificationComplete }: Props) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runVerification = useCallback(async () => {
    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/installation/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        const passed = data.status === 'pass';
        onVerificationComplete(passed, data.serverUrl);
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      onVerificationComplete(false, '');
    } finally {
      setIsVerifying(false);
    }
  }, [domain, onVerificationComplete]);

  // Auto-run verification on component mount
  useEffect(() => {
    runVerification();
  }, [runVerification]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-600">✓ Passed</Badge>;
      case 'fail':
        return <Badge variant="destructive">✗ Failed</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-600 text-white">⚠ Warning</Badge>;
      default:
        return <Badge variant="outline">Running...</Badge>;
    }
  };

  if (isVerifying && !result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Verifying Installation...
          </CardTitle>
          <CardDescription>
            Running automated checks to ensure everything works before showing embed code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Server Accessibility', 'Embed Script', 'Widget Page', 'OpenAI Embeddings', 'Chat API', 'Environment Variables'].map((check, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm">{check}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Verification Failed</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-2">
            <p>{error}</p>
            <Button onClick={runVerification} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Verification
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!result) {
    return null;
  }

  const { status, summary, checks, totalDuration, serverUrl } = result;

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Alert variant={status === 'pass' ? 'default' : status === 'fail' ? 'destructive' : 'default'}>
        {status === 'pass' ? <CheckCircle2 className="h-4 w-4" /> : status === 'fail' ? <XCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertTitle>
          {status === 'pass' && '✅ All Systems Operational'}
          {status === 'fail' && '❌ Critical Issues Detected'}
          {status === 'warning' && '⚠️ Warnings Detected'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-1">
            <p>
              {summary.passed} of {summary.total} checks passed
              {summary.warnings > 0 && ` • ${summary.warnings} warnings`}
              {summary.failed > 0 && ` • ${summary.failed} failed`}
            </p>
            <p className="text-xs">
              Verification completed in {totalDuration}ms • Server: {serverUrl}
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Detailed Checks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Checks</CardTitle>
              <CardDescription>
                Automated verification of all installation requirements
              </CardDescription>
            </div>
            <Button onClick={runVerification} variant="outline" size="sm" disabled={isVerifying}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isVerifying ? 'animate-spin' : ''}`} />
              Re-verify
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((check, index) => (
              <div key={index} className={`flex items-start gap-3 p-4 rounded-lg border ${
                check.status === 'pass' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' :
                check.status === 'fail' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900' :
                'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900'
              }`}>
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{check.check}</span>
                    {getStatusBadge(check.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                  {check.duration && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed in {check.duration}ms
                    </p>
                  )}
                  {check.details && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                        Show details
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(check.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Based on Status */}
      {status === 'fail' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Cannot Show Embed Code</AlertTitle>
          <AlertDescription>
            Critical issues must be resolved before installation can proceed. Please:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Ensure all required environment variables are set</li>
              <li>Verify OpenAI API key is configured</li>
              <li>Check that the server is accessible</li>
              <li>Contact support if issues persist</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {status === 'warning' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Proceed with Caution</AlertTitle>
          <AlertDescription>
            Some checks have warnings. The widget may work but with limited functionality. Review warnings above before proceeding.
          </AlertDescription>
        </Alert>
      )}

      {status === 'pass' && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900 dark:text-green-100">Ready to Install</AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-200">
            All systems verified and working. Your embed code is ready below!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
