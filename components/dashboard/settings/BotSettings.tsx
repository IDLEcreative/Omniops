"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, MessageSquare } from "lucide-react";
import { SettingsState } from "@/lib/dashboard/settings-utils";

interface BotSettingsProps {
  settings: SettingsState;
  onSettingChange: (key: string, value: any) => void;
}

export function BotSettings({ settings, onSettingChange }: BotSettingsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            Bot Configuration
          </CardTitle>
          <CardDescription>
            Configure your AI assistant behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botName">Bot Name</Label>
            <Input
              id="botName"
              value={settings.botName}
              onChange={(e) => onSettingChange('botName', e.target.value)}
              placeholder="Enter bot name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="botGreeting">Default Greeting</Label>
            <Textarea
              id="botGreeting"
              value={settings.botGreeting}
              onChange={(e) => onSettingChange('botGreeting', e.target.value)}
              placeholder="Enter the bot's greeting message"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Response Timeout (seconds)</Label>
            <Input
              type="number"
              value={settings.responseTimeout}
              onChange={(e) => onSettingChange('responseTimeout', e.target.value)}
              placeholder="30"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Chat Behavior
          </CardTitle>
          <CardDescription>
            Control chat flow and escalation rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Escalation</Label>
              <p className="text-sm text-muted-foreground">
                Escalate to human when confidence is low
              </p>
            </div>
            <Switch
              checked={settings.escalationEnabled}
              onCheckedChange={(checked) => onSettingChange('escalationEnabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Operating Hours</Label>
            <Select
              value={settings.operatingHours}
              onValueChange={(value) => onSettingChange('operatingHours', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24/7">24/7</SelectItem>
                <SelectItem value="business">Business Hours (9-5)</SelectItem>
                <SelectItem value="extended">Extended Hours (8-8)</SelectItem>
                <SelectItem value="custom">Custom Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
