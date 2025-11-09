"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ConfigureHeader } from "@/components/dashboard/integrations/woocommerce/configure/ConfigureHeader";
import { CredentialsForm } from "@/components/dashboard/integrations/woocommerce/configure/CredentialsForm";
import { TestConnection } from "@/components/dashboard/integrations/woocommerce/configure/TestConnection";
import { SetupInstructions } from "./components/SetupInstructions";
import { FeaturesShowcase } from "./components/FeaturesShowcase";
import { WebhookStatus } from "@/components/dashboard/integrations/WebhookStatus";
import { useWooCommerceConfiguration } from "@/hooks/woocommerce/useWooCommerceConfiguration";

export default function WooCommerceConfigurePage() {
  const {
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
  } = useWooCommerceConfiguration();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-4xl mx-auto">
      {/* Header */}
      <ConfigureHeader />

      {/* Setup Instructions */}
      <SetupInstructions />

      {/* Configuration Form */}
      <div className="space-y-6">
        <CredentialsForm
          storeUrl={storeUrl}
          consumerKey={consumerKey}
          consumerSecret={consumerSecret}
          onStoreUrlChange={setStoreUrl}
          onConsumerKeyChange={handleConsumerKeyChange}
          onConsumerSecretChange={handleConsumerSecretChange}
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

        {/* Webhook Status - Only show if credentials are configured */}
        {(consumerKey && !consumerKey.includes('••••')) || testResult?.success ? (
          <WebhookStatus
            domain={typeof window !== 'undefined' ? window.location.hostname : ''}
            platform="woocommerce"
          />
        ) : null}
      </div>

      {/* Features Showcase */}
      <FeaturesShowcase />
    </div>
  );
}
