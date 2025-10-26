"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { SettingsState } from "@/lib/dashboard/settings-utils";

interface SecuritySettingsProps {
  settings: SettingsState;
  onSettingChange: (key: string, value: any) => void;
}

export function SecuritySettings({ settings, onSettingChange }: SecuritySettingsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) => onSettingChange('twoFactorAuth', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Session Timeout (hours)</Label>
            <Input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => onSettingChange('sessionTimeout', e.target.value)}
              placeholder="8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ipWhitelist">IP Whitelist</Label>
            <Textarea
              id="ipWhitelist"
              value={settings.ipWhitelist}
              onChange={(e) => onSettingChange('ipWhitelist', e.target.value)}
              placeholder="192.168.1.0/24, 10.0.0.1"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Enter IP addresses or ranges (one per line)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Status</CardTitle>
          <CardDescription>
            Current security configuration overview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">SSL/TLS Encryption</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Encryption</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API Rate Limiting</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Audit Logging</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Partial
              </Badge>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Consider enabling full audit logging for compliance requirements.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
