"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export function useWooCommerceConfiguration() {
  const router = useRouter();
  const [storeUrl, setStoreUrl] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [credentialsFetched, setCredentialsFetched] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch(`/api/woocommerce/configure?domain=${window.location.hostname}`);
      const result = await response.json();

      if (result.success && result.configured) {
        setStoreUrl(result.url || "");

        // If credentials exist, show placeholder values
        if (result.hasCredentials) {
          setConsumerKey("ck_••••••••••••••••••••••••••••••••••••••••");
          setConsumerSecret("cs_••••••••••••••••••••••••••••••••••••••••");
        }
      }
    } catch (error) {
      console.error("Failed to load configuration:", error);
    }
  };

  const fetchActualCredentials = async () => {
    if (credentialsFetched) return; // Already fetched

    try {
      const response = await fetch(`/api/woocommerce/credentials?domain=${window.location.hostname}`);
      const result = await response.json();

      if (result.success) {
        setConsumerKey(result.consumerKey);
        setConsumerSecret(result.consumerSecret);
        setCredentialsFetched(true);
      }
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
    }
  };

  const handleConsumerKeyChange = (value: string) => {
    // If user is editing placeholder, fetch real credentials first
    if (!credentialsFetched && consumerKey.includes('••••')) {
      fetchActualCredentials();
    } else {
      setConsumerKey(value);
    }
  };

  const handleConsumerSecretChange = (value: string) => {
    // If user is editing placeholder, fetch real credentials first
    if (!credentialsFetched && consumerSecret.includes('••••')) {
      fetchActualCredentials();
    } else {
      setConsumerSecret(value);
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
      // Check if using placeholder credentials (existing config)
      const isPlaceholder = consumerKey.includes('••••') || consumerSecret.includes('••••');

      if (!isPlaceholder) {
        // Step 1: Save new configuration
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
      }

      // Step 2: Test connection using dynamic mode (database credentials)
      const testResponse = await fetch(
        `/api/woocommerce/test?mode=dynamic&domain=${window.location.hostname}`
      );
      const testData = await testResponse.json();

      if (testData.success) {
        setTestResult({
          success: true,
          message: `✓ Successfully connected to your store!`,
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

    // Check if using placeholder credentials
    const isPlaceholder = consumerKey.includes('••••') || consumerSecret.includes('••••');

    if (isPlaceholder) {
      // Configuration already exists, just redirect
      setTestResult({
        success: true,
        message: "✓ Configuration is already saved!",
      });

      setTimeout(() => {
        router.push("/dashboard/integrations");
      }, 1500);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Save WooCommerce configuration
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

      if (!result.success) {
        setTestResult({
          success: false,
          message: result.error || "Failed to save configuration",
        });
        setLoading(false);
        return;
      }

      // Step 2: Automatically register webhook
      setTestResult({
        success: true,
        message: "✓ Configuration saved! Setting up purchase tracking...",
      });

      try {
        const webhookResponse = await fetch("/api/webhooks/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: window.location.hostname,
            platform: "woocommerce",
            action: "register",
          }),
        });

        const webhookResult = await webhookResponse.json();

        if (webhookResult.success) {
          setTestResult({
            success: true,
            message: "✓ Configuration saved and purchase tracking enabled!",
          });
        } else {
          setTestResult({
            success: true,
            message: "✓ Configuration saved (webhook setup will retry automatically)",
          });
        }
      } catch (webhookError) {
        console.error("Webhook registration failed:", webhookError);
        setTestResult({
          success: true,
          message: "✓ Configuration saved (webhook setup will retry automatically)",
        });
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/integrations");
      }, 2000);
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to save configuration. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    storeUrl,
    consumerKey,
    consumerSecret,
    testResult,
    loading,
    setStoreUrl,
    handleConsumerKeyChange,
    handleConsumerSecretChange,
    handleTestConnection,
    handleSave,
  };
}
