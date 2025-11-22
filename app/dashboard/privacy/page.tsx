"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Shield, Cookie, UserCheck, FileText } from "lucide-react";
import { DataRetentionSettings } from "@/components/dashboard/privacy/DataRetentionSettings";
import { ConsentManagement } from "@/components/dashboard/privacy/ConsentManagement";
import { DataExportSection } from "@/components/dashboard/privacy/DataExportSection";
import { GDPRComplianceSection } from "@/components/dashboard/privacy/GDPRComplianceSection";
import { SecuritySettings } from "@/components/dashboard/privacy/SecuritySettings";
import { PrivacyAuditLog } from "@/components/dashboard/privacy/PrivacyAuditLog";
import { PrivacyRightsInfo } from "@/components/privacy/privacy-rights-info";
import { CookiePreferences } from "@/components/privacy/cookie-preferences";
import { ExportDataButton } from "@/components/privacy/export-data-button";
import { DeleteAccountButton } from "@/components/privacy/delete-account-button";
import {
  DEFAULT_PRIVACY_SETTINGS,
  type PrivacySettings,
  type GdprRequestForm,
  type RequestField,
} from "@/types/privacy";

export default function PrivacyPage() {
  const [isDirty, setIsDirty] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({ ...DEFAULT_PRIVACY_SETTINGS });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const initialRequestState: GdprRequestForm = {
    domain: '',
    sessionId: '',
    email: '',
    confirm: false,
  };

  const [requestForm, setRequestForm] = useState<GdprRequestForm>(initialRequestState);

  const handleSettingChange = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    console.log("Saving privacy settings:", settings);
    setIsDirty(false);
  };

  const handleReset = () => {
    setIsDirty(false);
    setSettings({ ...DEFAULT_PRIVACY_SETTINGS });
    setRequestForm(initialRequestState);
    setSuccessMessage(null);
  };

  const handleRequestChange = (key: RequestField, value: string | boolean) => {
    setRequestForm(prev => ({ ...prev, [key]: value }));
    setSuccessMessage(null);
  };

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
  };

  const handleRightAction = (article: string) => {
    // Navigate to appropriate tab based on the article
    const tabMap: Record<string, string> = {
      'Article 15': 'gdpr',
      'Article 16': 'gdpr',
      'Article 17': 'gdpr',
      'Article 20': 'gdpr',
      'Article 21': 'cookies',
    };

    const tab = tabMap[article];
    if (tab) {
      // This would typically be handled by a ref or state management
      console.log(`Navigating to ${tab} tab for ${article}`);
    }
  };

  const handleAccountDeleted = () => {
    // Handle account deletion - typically redirect to logout
    window.location.href = '/auth/logout';
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Shield className="h-8 w-8 mr-3 text-primary" />
            Privacy & Security Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your data privacy, security settings, and exercise your GDPR rights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
        <ExportDataButton variant="outline" />
        <DeleteAccountButton onAccountDeleted={handleAccountDeleted} />
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Privacy Policy
        </Button>
        <Button variant="outline">
          <UserCheck className="h-4 w-4 mr-2" />
          Verify My Data
        </Button>
      </div>

      {/* Privacy & Security Tabs */}
      <Tabs defaultValue="rights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rights">Your Rights</TabsTrigger>
          <TabsTrigger value="cookies">Cookies</TabsTrigger>
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR Tools</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Your Rights Tab */}
        <TabsContent value="rights" className="space-y-6">
          <PrivacyRightsInfo showActions={true} onActionClick={handleRightAction} />
        </TabsContent>

        {/* Cookies Tab */}
        <TabsContent value="cookies" className="space-y-6">
          <div className="grid gap-6">
            <CookiePreferences />
            <ConsentManagement
              settings={settings}
              onSettingChange={handleSettingChange}
            />
          </div>
        </TabsContent>

        {/* Data Retention */}
        <TabsContent value="retention" className="space-y-6">
          <DataRetentionSettings
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        </TabsContent>

        {/* GDPR Tools */}
        <TabsContent value="gdpr" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataExportSection
              settings={settings}
              requestForm={requestForm}
              successMessage={successMessage}
              onSettingChange={handleSettingChange}
              onRequestChange={handleRequestChange}
              onSuccess={handleSuccess}
              onAuditRefresh={async () => {}}
            />
            <GDPRComplianceSection />
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <SecuritySettings
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="space-y-6">
          <PrivacyAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}