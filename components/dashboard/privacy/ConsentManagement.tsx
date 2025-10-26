"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe } from "lucide-react";
import type { PrivacySettings } from "@/types/privacy";

interface ConsentManagementProps {
  settings: PrivacySettings;
  onSettingChange: (key: string, value: boolean) => void;
}

export function ConsentManagement({ settings, onSettingChange }: ConsentManagementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Consent Management
        </CardTitle>
        <CardDescription>
          Configure user consent and data processing options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Cookie Consent Banner</Label>
            <p className="text-sm text-muted-foreground">
              Show cookie consent banner to EU visitors
            </p>
          </div>
          <Switch
            checked={settings.cookieConsent}
            onCheckedChange={(checked) => onSettingChange('cookieConsent', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Data Processing Consent</Label>
            <p className="text-sm text-muted-foreground">
              Require explicit consent for data processing
            </p>
          </div>
          <Switch
            checked={settings.dataProcessingConsent}
            onCheckedChange={(checked) => onSettingChange('dataProcessingConsent', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Consent Record Keeping</Label>
            <p className="text-sm text-muted-foreground">
              Store detailed consent records for compliance
            </p>
          </div>
          <Switch
            checked={settings.consentRecords}
            onCheckedChange={(checked) => onSettingChange('consentRecords', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
