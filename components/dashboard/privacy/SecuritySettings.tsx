"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye, Shield, Key, Activity, CheckCircle } from "lucide-react";
import type { PrivacySettings } from "@/types/privacy";

interface SecuritySettingsProps {
  settings: PrivacySettings;
  onSettingChange: (key: string, value: boolean) => void;
}

export function SecuritySettings({ settings, onSettingChange }: SecuritySettingsProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Encryption & Security
            </CardTitle>
            <CardDescription>
              Configure data encryption and security measures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Encryption at Rest</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt stored data using AES-256
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Encryption in Transit</Label>
                <p className="text-sm text-muted-foreground">
                  TLS 1.3 encryption for all communications
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>IP Address Anonymization</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically anonymize visitor IP addresses
                </p>
              </div>
              <Switch
                checked={settings.anonymizeIPs}
                onCheckedChange={(checked) => onSettingChange('anonymizeIPs', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Secure Headers</Label>
                <p className="text-sm text-muted-foreground">
                  Enable security headers (CSP, HSTS, etc.)
                </p>
              </div>
              <Switch
                checked={settings.secureHeaders}
                onCheckedChange={(checked) => onSettingChange('secureHeaders', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Privacy Features
            </CardTitle>
            <CardDescription>
              Advanced privacy protection settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Minimization</Label>
                <p className="text-sm text-muted-foreground">
                  Only collect necessary data for operations
                </p>
              </div>
              <Switch
                checked={settings.dataMinimization}
                onCheckedChange={(checked) => onSettingChange('dataMinimization', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pseudonymization</Label>
                <p className="text-sm text-muted-foreground">
                  Replace personal identifiers with pseudonyms
                </p>
              </div>
              <Switch
                checked={settings.pseudonymization}
                onCheckedChange={(checked) => onSettingChange('pseudonymization', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Purpose Limitation</Label>
                <p className="text-sm text-muted-foreground">
                  Use data only for its intended purpose
                </p>
              </div>
              <Switch
                checked={settings.purposeLimitation}
                onCheckedChange={(checked) => onSettingChange('purposeLimitation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Storage Minimization</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically delete data when no longer needed
                </p>
              </div>
              <Switch
                checked={settings.storageMinimization}
                onCheckedChange={(checked) => onSettingChange('storageMinimization', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Status Overview
          </CardTitle>
          <CardDescription>
            Current security configuration and threat protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-green-700">Strong Protection</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All critical security measures active
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Key className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-700">Encrypted Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                End-to-end encryption enabled
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-12 w-12 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-700">Active Monitoring</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time security monitoring
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
