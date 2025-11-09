"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/integrations/shopify/PageHeader";
import { SetupInstructions } from "@/components/dashboard/integrations/shopify/SetupInstructions";
import { ConnectionForm } from "@/components/dashboard/integrations/shopify/ConnectionForm";
import { FeaturesCard } from "@/components/dashboard/integrations/shopify/FeaturesCard";
import { WebhookStatus } from "@/components/dashboard/integrations/WebhookStatus";

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
      // Step 1: Save Shopify configuration
      const response = await fetch("/api/shopify/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: shopDomain,
          accessToken: accessToken,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setTestResult({
          success: false,
          message: result.error || "Failed to save configuration",
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Automatically register webhook
      setTestResult({
        success: true,
        message: "Configuration saved! Setting up purchase tracking...",
      });

      try {
        const webhookResponse = await fetch("/api/webhooks/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: window.location.hostname,
            platform: "shopify",
            action: "register",
          }),
        });

        const webhookResult = await webhookResponse.json();

        if (webhookResult.success) {
          setTestResult({
            success: true,
            message: "Shopify integration configured and purchase tracking enabled!",
          });
        } else {
          setTestResult({
            success: true,
            message: "Configuration saved (webhook setup will retry automatically)",
          });
        }
      } catch (webhookError) {
        console.error("Webhook registration failed:", webhookError);
        setTestResult({
          success: true,
          message: "Configuration saved (webhook setup will retry automatically)",
        });
      }

      // Redirect to integrations page after a delay
      setTimeout(() => {
        router.push("/dashboard/integrations");
      }, 2000);
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
      <PageHeader />
      <SetupInstructions />

      <div className="mt-6">
        <ConnectionForm
          shopDomain={shopDomain}
          setShopDomain={setShopDomain}
          accessToken={accessToken}
          setAccessToken={setAccessToken}
          showToken={showToken}
          setShowToken={setShowToken}
          testResult={testResult}
          isTesting={isTesting}
          isLoading={isLoading}
          onTestConnection={handleTestConnection}
          onSave={handleSave}
          formatShopDomain={formatShopDomain}
        />
      </div>

      {/* Webhook Status - Only show if credentials are configured */}
      {(shopDomain && accessToken) || testResult?.success ? (
        <div className="mt-6">
          <WebhookStatus
            domain={typeof window !== 'undefined' ? window.location.hostname : ''}
            platform="shopify"
          />
        </div>
      ) : null}

      <div className="mt-6">
        <FeaturesCard />
      </div>
    </div>
  );
}
