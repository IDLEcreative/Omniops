"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

interface TestConnectionProps {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  testResult: TestResult | null;
  loading: boolean;
  onTestConnection: () => Promise<void>;
  onSave: () => Promise<void>;
}

export function TestConnection({
  storeUrl,
  consumerKey,
  consumerSecret,
  testResult,
  loading,
  onTestConnection,
  onSave,
}: TestConnectionProps) {
  const isFormValid = storeUrl && consumerKey && consumerSecret;

  return (
    <>
      {/* Test Result Alert */}
      {testResult && (
        <Alert
          className={
            testResult.success
              ? "border-green-200 bg-green-50 dark:bg-green-950/20"
              : "border-red-200 bg-red-50 dark:bg-red-950/20"
          }
        >
          {testResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className="text-sm">
            {testResult.message}
            {testResult.success && testResult.details?.testProduct && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-xs text-muted-foreground">
                  Test product: {testResult.details.testProduct.name}
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onTestConnection}
          variant="outline"
          disabled={loading || !isFormValid}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>Test Connection</>
          )}
        </Button>
        <Button onClick={onSave} disabled={loading || !isFormValid} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>Save Configuration</>
          )}
        </Button>
      </div>
    </>
  );
}
