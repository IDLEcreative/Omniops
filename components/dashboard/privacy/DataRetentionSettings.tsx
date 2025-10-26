"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Database, Archive, Trash2 } from "lucide-react";
import type { PrivacySettings } from "@/types/privacy";

interface DataRetentionSettingsProps {
  settings: PrivacySettings;
  onSettingChange: (key: string, value: string | number | boolean) => void;
}

export function DataRetentionSettings({ settings, onSettingChange }: DataRetentionSettingsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Retention Policies
          </CardTitle>
          <CardDescription>
            Configure how long data is stored in your system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Chat History Retention (days)</Label>
            <Input
              type="number"
              value={settings.chatRetentionDays}
              onChange={(e) => onSettingChange('chatRetentionDays', e.target.value)}
              placeholder="365"
            />
            <p className="text-xs text-muted-foreground">
              How long to keep conversation history before deletion
            </p>
          </div>

          <div className="space-y-2">
            <Label>Auto-archive After (days)</Label>
            <Input
              type="number"
              value={settings.archiveAfterDays}
              onChange={(e) => onSettingChange('archiveAfterDays', e.target.value)}
              placeholder="90"
            />
            <p className="text-xs text-muted-foreground">
              Move conversations to cold storage after this period
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-delete Inactive Users</Label>
              <p className="text-sm text-muted-foreground">
                Automatically remove data for users inactive for 2+ years
              </p>
            </div>
            <Switch
              checked={settings.autoDeleteInactive}
              onCheckedChange={(checked) => onSettingChange('autoDeleteInactive', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Data Management
          </CardTitle>
          <CardDescription>
            Current storage usage and cleanup options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Conversations</span>
              <span className="text-sm font-medium">45,832</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Archived Conversations</span>
              <span className="text-sm font-medium">12,450</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">User Profiles</span>
              <span className="text-sm font-medium">8,921</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage Used</span>
              <span className="text-sm font-medium">2.4 GB</span>
            </div>
          </div>

          <Alert>
            <Archive className="h-4 w-4" />
            <AlertDescription>
              Next auto-archive scheduled for January 20, 2025
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              <Archive className="h-4 w-4 mr-2" />
              Archive Old Data Now
            </Button>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Clean Expired Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
