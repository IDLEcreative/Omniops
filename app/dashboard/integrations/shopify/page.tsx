"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Shield,
  Key,
  Store,
  Info,
} from "lucide-react";

export default function ShopifyIntegrationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Form state
  const [shopDomain, setShopDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  // Load existing configuration
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch(`/api/shopify/configure?domain=${window.location.hostname}`);
      const result = await response.json();

      if (result.success && result.configured && result.shop) {
        setShopDomain(result.shop);
        // Note: Don't populate access token for security - require re-entry to make changes
      }
    } catch (error) {
      console.error("Failed to load configuration:", error);
    }
  };

  const handleTestConnection = async () => {
    if (!shopDomain || !accessToken) {
      setTestResult({
        success: false,
        message: "Please fill in all required fields",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // First, save the configuration
      const saveResponse = await fetch("/api/shopify/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: shopDomain,
          accessToken: accessToken,
        }),
      });

      const saveResult = await saveResponse.json();

      if (!saveResult.success) {
        setTestResult({
          success: false,
          message: saveResult.error || "Failed to save configuration",
        });
        setIsTesting(false);
        return;
      }

      // Then test the connection
      const testResponse = await fetch(`/api/shopify/test?domain=${window.location.hostname}`);
      const result = await testResponse.json();

      setTestResult({
        success: result.success,
        message: result.message || (result.success ? "Connection successful!" : "Connection failed"),
        details: result,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Failed to test connection",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!shopDomain || !accessToken) {
      setTestResult({
        success: false,
        message: "Please fill in all required fields",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/shopify/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: shopDomain,
          accessToken: accessToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestResult({
          success: true,
          message: "Shopify integration configured successfully!",
        });

        // Redirect to integrations page after a delay
        setTimeout(() => {
          router.push("/dashboard/integrations");
        }, 2000);
      } else {
        setTestResult({
          success: false,
          message: result.error || "Failed to save configuration",
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Failed to save configuration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatShopDomain = (value: string) => {
    // Auto-format to ensure .myshopify.com
    let formatted = value.toLowerCase().replace(/\s/g, "");

    // Remove https://, http://, and trailing slashes
    formatted = formatted.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // If user enters just the store name, add .myshopify.com
    if (formatted && !formatted.includes(".")) {
      formatted = `${formatted}.myshopify.com`;
    }

    return formatted;
  };

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/integrations")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Shopify Integration</h1>
              <p className="text-sm text-muted-foreground">
                Connect your Shopify store to enable product search and order management
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions Card */}
      <Card className="mb-6 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Setup Instructions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-2">To connect your Shopify store:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Log into your Shopify Admin dashboard</li>
              <li>Navigate to <strong>Settings → Apps and sales channels</strong></li>
              <li>Click <strong>Develop apps</strong> (enable custom apps if needed)</li>
              <li>Click <strong>Create an app</strong> and name it "Omniops"</li>
              <li>
                Select API scopes: <code className="text-xs bg-white px-1 py-0.5 rounded">read_products</code>,{" "}
                <code className="text-xs bg-white px-1 py-0.5 rounded">read_orders</code>,{" "}
                <code className="text-xs bg-white px-1 py-0.5 rounded">read_customers</code>
              </li>
              <li>Install the app and reveal your access token</li>
              <li>Copy your shop domain and access token below</li>
            </ol>
          </div>
          <div className="pt-2 border-t">
            <a
              href="https://shopify.dev/docs/api/admin-rest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
            >
              View Shopify API Documentation
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
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
              onClick={handleTestConnection}
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
              onClick={handleSave}
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

      {/* Features Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">What you can do with Shopify integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Product Search</p>
                <p className="text-xs text-muted-foreground">Search and display product information in chat</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Order Lookup</p>
                <p className="text-xs text-muted-foreground">Check order status by ID or customer email</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Stock Checking</p>
                <p className="text-xs text-muted-foreground">Real-time inventory availability</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Customer Support</p>
                <p className="text-xs text-muted-foreground">Answer customer questions about products and orders</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
