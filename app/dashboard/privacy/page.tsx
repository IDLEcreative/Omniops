"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw } from "lucide-react";
import { DataRetentionSettings } from "@/components/dashboard/privacy/DataRetentionSettings";
import { ConsentManagement } from "@/components/dashboard/privacy/ConsentManagement";
import { DataExportSection } from "@/components/dashboard/privacy/DataExportSection";
import { GDPRComplianceSection } from "@/components/dashboard/privacy/GDPRComplianceSection";
import { SecuritySettings } from "@/components/dashboard/privacy/SecuritySettings";
import { PrivacyAuditLog } from "@/components/dashboard/privacy/PrivacyAuditLog";
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

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy & Security</h1>
          <p className="text-muted-foreground mt-2">
            Manage data privacy, security settings, and compliance requirements
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

      {/* Privacy & Security Tabs */}
      <Tabs defaultValue="retention" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR Compliance</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Data Retention */}
        <TabsContent value="retention" className="space-y-6">
          <DataRetentionSettings
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        </TabsContent>

        {/* GDPR Compliance */}
        <TabsContent value="gdpr" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConsentManagement
              settings={settings}
              onSettingChange={handleSettingChange}
            />
            <DataExportSection
              settings={settings}
              requestForm={requestForm}
              successMessage={successMessage}
              onSettingChange={handleSettingChange}
              onRequestChange={handleRequestChange}
              onSuccess={handleSuccess}
              onAuditRefresh={async () => {}}
            />
          </div>
          <GDPRComplianceSection />
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
