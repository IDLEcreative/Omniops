"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Server, Archive, Trash2, AlertCircle } from "lucide-react";
import { SettingsState } from "@/lib/dashboard/settings-utils";

interface AdvancedSettingsProps {
  settings: SettingsState;
  onSettingChange: (key: string, value: any) => void;
}

export function AdvancedSettings({ settings, onSettingChange }: AdvancedSettingsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Advanced system settings and performance tuning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Debug Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable detailed logging and error reporting
              </p>
            </div>
            <Switch
              checked={settings.debugMode}
              onCheckedChange={(checked) => onSettingChange('debugMode', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Log Level</Label>
            <Select
              value={settings.logLevel}
              onValueChange={(value) => onSettingChange('logLevel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="verbose">Verbose</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Max Concurrent Chats</Label>
            <Input
              type="number"
              value={settings.maxConcurrentChats}
              onChange={(e) => onSettingChange('maxConcurrentChats', e.target.value)}
              placeholder="100"
            />
          </div>

          <div className="space-y-2">
            <Label>Rate Limit (requests/minute)</Label>
            <Input
              type="number"
              value={settings.rateLimitPerMinute}
              onChange={(e) => onSettingChange('rateLimitPerMinute', e.target.value)}
              placeholder="60"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Archive className="h-5 w-5 mr-2" />
            Data Management
          </CardTitle>
          <CardDescription>
            Configure data retention and cleanup policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These settings affect data retention and cannot be easily reversed.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto-archive old conversations</span>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label>Archive after (days)</Label>
              <Input type="number" defaultValue="90" placeholder="90" />
            </div>

            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
