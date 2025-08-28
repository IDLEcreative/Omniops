"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Database,
  Zap,
  Mail,
  Smartphone,
  Clock,
  Languages,
  Palette,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Link,
  Key,
  Server,
  Activity,
  Users,
  MessageSquare,
  Bot,
  Code,
  Webhook,
  Archive,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SettingsPage() {
  const [isDirty, setIsDirty] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    companyName: "Omniops Customer Service",
    companyDescription: "AI-powered customer service chat widget",
    timeZone: "America/New_York",
    language: "en",
    currency: "USD",
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklyReports: true,
    
    // Bot Settings
    botName: "Customer Assistant",
    botGreeting: "Hi! How can I help you today?",
    responseTimeout: "30",
    escalationEnabled: true,
    operatingHours: "24/7",
    
    // Security
    twoFactorAuth: true,
    sessionTimeout: "8",
    ipWhitelist: "",
    
    // Integrations
    openaiApiKey: "sk-..." + "*".repeat(20),
    supabaseUrl: "https://your-project.supabase.co",
    redisUrl: "redis://localhost:6379",
    
    // Advanced
    debugMode: false,
    logLevel: "info",
    maxConcurrentChats: "100",
    rateLimitPerMinute: "60",
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    // Save settings logic would go here
    console.log("Saving settings:", settings);
    setIsDirty(false);
    // Show success message
  };

  const handleReset = () => {
    // Reset to defaults logic would go here
    setIsDirty(false);
  };

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

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => handleSettingChange('companyName', e.target.value)}
                    placeholder="Enter your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyDescription">Description</Label>
                  <Textarea
                    id="companyDescription"
                    value={settings.companyDescription}
                    onChange={(e) => handleSettingChange('companyDescription', e.target.value)}
                    placeholder="Brief description of your company"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Regional Settings
                </CardTitle>
                <CardDescription>
                  Configure timezone, language, and currency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Select 
                    value={settings.timeZone} 
                    onValueChange={(value) => handleSettingChange('timeZone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">GMT</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value) => handleSettingChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select 
                    value={settings.currency} 
                    onValueChange={(value) => handleSettingChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label>Email Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates for important events
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Smartphone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label>SMS Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive text messages for urgent alerts
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label>Push Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Show browser notifications for real-time updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label>Weekly Reports</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly performance summaries
                    </p>
                  </div>
                  <Switch
                    checked={settings.weeklyReports}
                    onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>
                  Configure specific notification triggers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New conversations</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed escalations</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System errors</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low satisfaction scores</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Team member activity</span>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bot Settings */}
        <TabsContent value="bot" className="space-y-6">
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
                    onChange={(e) => handleSettingChange('botName', e.target.value)}
                    placeholder="Enter bot name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="botGreeting">Default Greeting</Label>
                  <Textarea
                    id="botGreeting"
                    value={settings.botGreeting}
                    onChange={(e) => handleSettingChange('botGreeting', e.target.value)}
                    placeholder="Enter the bot's greeting message"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Response Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.responseTimeout}
                    onChange={(e) => handleSettingChange('responseTimeout', e.target.value)}
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
                    onCheckedChange={(checked) => handleSettingChange('escalationEnabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Operating Hours</Label>
                  <Select 
                    value={settings.operatingHours} 
                    onValueChange={(value) => handleSettingChange('operatingHours', value)}
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
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
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
                    onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Session Timeout (hours)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                    placeholder="8"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                  <Textarea
                    id="ipWhitelist"
                    value={settings.ipWhitelist}
                    onChange={(e) => handleSettingChange('ipWhitelist', e.target.value)}
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
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Configure external service integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openaiKey">OpenAI API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="openaiKey"
                      type="password"
                      value={settings.openaiApiKey}
                      onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)}
                      placeholder="sk-..."
                    />
                    <Button variant="outline" size="icon">
                      <Link className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supabaseUrl">Supabase URL</Label>
                  <Input
                    id="supabaseUrl"
                    value={settings.supabaseUrl}
                    onChange={(e) => handleSettingChange('supabaseUrl', e.target.value)}
                    placeholder="https://your-project.supabase.co"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="redisUrl">Redis URL</Label>
                  <Input
                    id="redisUrl"
                    value={settings.redisUrl}
                    onChange={(e) => handleSettingChange('redisUrl', e.target.value)}
                    placeholder="redis://localhost:6379"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Webhook className="h-5 w-5 mr-2" />
                  Webhooks
                </CardTitle>
                <CardDescription>
                  Configure webhook endpoints for external notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Webhooks Configured</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add webhook endpoints to receive real-time notifications
                  </p>
                  <Button variant="outline">
                    <Webhook className="h-4 w-4 mr-2" />
                    Add Webhook
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-6">
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
                    onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Log Level</Label>
                  <Select 
                    value={settings.logLevel} 
                    onValueChange={(value) => handleSettingChange('logLevel', value)}
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
                    onChange={(e) => handleSettingChange('maxConcurrentChats', e.target.value)}
                    placeholder="100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Rate Limit (requests/minute)</Label>
                  <Input
                    type="number"
                    value={settings.rateLimitPerMinute}
                    onChange={(e) => handleSettingChange('rateLimitPerMinute', e.target.value)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}