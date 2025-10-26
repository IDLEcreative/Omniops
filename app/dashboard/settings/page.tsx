"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, RotateCcw } from "lucide-react";
import {
  SettingsState,
  DEFAULT_SETTINGS,
  SaveStatus,
  saveSettingsToAPI,
  loadSettingsFromAPI,
} from "@/lib/dashboard/settings-utils";
import { GeneralSettings } from "@/components/dashboard/settings/GeneralSettings";
import { NotificationSettings } from "@/components/dashboard/settings/NotificationSettings";
import { BotSettings } from "@/components/dashboard/settings/BotSettings";
import { SecuritySettings } from "@/components/dashboard/settings/SecuritySettings";
import { APIKeysSection } from "@/components/dashboard/settings/APIKeysSection";
import { AdvancedSettings } from "@/components/dashboard/settings/AdvancedSettings";

export default function SettingsPage() {
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus('saving');

    try {
      await saveSettingsToAPI(settings);
      setIsDirty(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setIsDirty(false);
  };

  // Load existing settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await loadSettingsFromAPI();
        setSettings(prev => ({ ...prev, ...loadedSettings }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your application preferences and integrations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={loading || !isDirty}>
            {loading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="bot">Bot Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        </TabsContent>

        <TabsContent value="bot" className="space-y-6">
          <BotSettings
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <APIKeysSection
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <AdvancedSettings
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
