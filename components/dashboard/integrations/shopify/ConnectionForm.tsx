"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Key,
  Store,
} from "lucide-react";

interface ConnectionFormProps {
  shopDomain: string;
  setShopDomain: (domain: string) => void;
  accessToken: string;
  setAccessToken: (token: string) => void;
  showToken: boolean;
  setShowToken: (show: boolean) => void;
  testResult: {
    success: boolean;
    message: string;
    details?: any;
  } | null;
  isTesting: boolean;
  isLoading: boolean;
  onTestConnection: () => void;
  onSave: () => void;
  formatShopDomain: (value: string) => string;
}

export function ConnectionForm({
  shopDomain,
  setShopDomain,
  accessToken,
  setAccessToken,
  showToken,
  setShowToken,
  testResult,
  isTesting,
  isLoading,
  onTestConnection,
  onSave,
  formatShopDomain,
}: ConnectionFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Details</CardTitle>
        <CardDescription>
          Enter your Shopify store credentials to enable the integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shop Domain */}
        <div className="space-y-2">
          <Label htmlFor="shopDomain" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Shop Domain
            <Badge variant="secondary" className="ml-auto text-xs">Required</Badge>
          </Label>
          <Input
            id="shopDomain"
            type="text"
            placeholder="mystore.myshopify.com"
            value={shopDomain}
            onChange={(e) => setShopDomain(formatShopDomain(e.target.value))}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Your Shopify store domain (e.g., <code>mystore.myshopify.com</code>)
          </p>
        </div>

        {/* Access Token */}
        <div className="space-y-2">
          <Label htmlFor="accessToken" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Admin API Access Token
            <Badge variant="secondary" className="ml-auto text-xs">Required</Badge>
          </Label>
          <div className="relative">
            <Input
              id="accessToken"
              type={showToken ? "text" : "password"}
              placeholder="shpat_..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="font-mono pr-20"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? "Hide" : "Show"}
            </Button>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>
              Your access token is encrypted using AES-256-GCM before being stored
            </span>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert className={testResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className="text-sm">
              {testResult.message}
              {testResult.details?.testProduct && (
                <div className="mt-2 p-2 bg-white rounded border text-xs">
                  <strong>Test Product Found:</strong> {testResult.details.testProduct.title}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onTestConnection}
            disabled={isTesting || !shopDomain || !accessToken}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading || !shopDomain || !accessToken}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
