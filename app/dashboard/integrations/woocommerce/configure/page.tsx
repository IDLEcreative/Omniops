"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Search, Package, Users, TrendingUp } from "lucide-react";
import { ConfigureHeader } from "@/components/dashboard/integrations/woocommerce/configure/ConfigureHeader";
import { CredentialsForm } from "@/components/dashboard/integrations/woocommerce/configure/CredentialsForm";
import { TestConnection } from "@/components/dashboard/integrations/woocommerce/configure/TestConnection";

export default function WooCommerceConfigurePage() {
  const router = useRouter();
  const [storeUrl, setStoreUrl] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch(`/api/woocommerce/configure?domain=${window.location.hostname}`);
      const result = await response.json();

      if (result.success && result.configured) {
        setStoreUrl(result.url || "");
        // Security: Don't populate keys - require re-entry to make changes
      }
    } catch (error) {
      console.error("Failed to load configuration:", error);
    }
  };

  const handleTestConnection = async () => {
    if (!storeUrl || !consumerKey || !consumerSecret) {
      setTestResult({
        success: false,
        message: "Please fill in all fields before testing",
      });
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      // Step 1: Save configuration
      const saveResponse = await fetch("/api/woocommerce/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: storeUrl,
          consumerKey,
          consumerSecret,
        }),
      });

      const saveResult = await saveResponse.json();

      if (!saveResult.success) {
        setTestResult({
          success: false,
          message: saveResult.error || "Failed to save configuration",
        });
        setLoading(false);
        return;
      }

      // Step 2: Test connection
      const testResponse = await fetch(
        `/api/woocommerce/test?domain=${window.location.hostname}`
      );
      const testData = await testResponse.json();

      if (testData.success && testData.configured) {
        setTestResult({
          success: true,
          message: `✓ Successfully connected to ${testData.storeName || "your store"}!`,
          details: testData,
        });
      } else {
        setTestResult({
          success: false,
          message: testData.error || "Connection test failed",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to test connection. Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!storeUrl || !consumerKey || !consumerSecret) {
      setTestResult({
        success: false,
        message: "Please fill in all required fields",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/woocommerce/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: storeUrl,
          consumerKey,
          consumerSecret,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestResult({
          success: true,
          message: "✓ Configuration saved successfully!",
        });

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/integrations");
        }, 2000);
      } else {
        setTestResult({
          success: false,
          message: result.error || "Failed to save configuration",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to save configuration. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-4xl mx-auto">
      {/* Header */}
      <ConfigureHeader />

      {/* Setup Instructions */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-base">Setup Instructions</CardTitle>
          <CardDescription>Follow these steps to connect your WooCommerce store</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">1.</span>
              <span>Log into your WooCommerce Admin dashboard</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">2.</span>
              <span>Navigate to <strong>WooCommerce → Settings → Advanced → REST API</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">3.</span>
              <span>Click <strong>"Add key"</strong> to create new API credentials</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">4.</span>
              <span>Set <strong>Description</strong> to "Omniops"</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">5.</span>
              <span>Set <strong>Permissions</strong> to "Read" (read-only access)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">6.</span>
              <span>Click <strong>"Generate API key"</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">7.</span>
              <span>Copy the <strong>Consumer key</strong> and <strong>Consumer secret</strong> below</span>
            </li>
          </ol>
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            <a
              href="https://woocommerce.com/document/woocommerce-rest-api/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline"
            >
              WooCommerce REST API Documentation
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <div className="space-y-6">
        <CredentialsForm
          storeUrl={storeUrl}
          consumerKey={consumerKey}
          consumerSecret={consumerSecret}
          onStoreUrlChange={setStoreUrl}
          onConsumerKeyChange={setConsumerKey}
          onConsumerSecretChange={setConsumerSecret}
        />

        <Card>
          <CardContent className="pt-6">
            <TestConnection
              storeUrl={storeUrl}
              consumerKey={consumerKey}
              consumerSecret={consumerSecret}
              testResult={testResult}
              loading={loading}
              onTestConnection={handleTestConnection}
              onSave={handleSave}
            />
          </CardContent>
        </Card>
      </div>

      {/* Features Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What You'll Get</CardTitle>
          <CardDescription>Features enabled with this integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Product Search</h4>
                <p className="text-xs text-muted-foreground">
                  AI can search and recommend products from your catalog
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Order Tracking</h4>
                <p className="text-xs text-muted-foreground">
                  Help customers track and lookup their order status
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Stock Information</h4>
                <p className="text-xs text-muted-foreground">
                  Provide real-time inventory and availability updates
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Customer Support</h4>
                <p className="text-xs text-muted-foreground">
                  Enhanced customer service with order and product context
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
