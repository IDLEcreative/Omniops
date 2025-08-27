'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Database, 
  AlertCircle,
  CheckCircle,
  Download,
  Trash2,
  Calendar,
  Globe,
  UserX
} from 'lucide-react';

interface PrivacySettings {
  dataRetention: {
    conversationDays: number;
    analyticsMonths: number;
    autoDelete: boolean;
  };
  userRights: {
    allowOptOut: boolean;
    showPrivacyNotice: boolean;
    requireConsent: boolean;
    allowDataExport: boolean;
    allowDataDeletion: boolean;
  };
  compliance: {
    gdprEnabled: boolean;
    ccpaEnabled: boolean;
    cookieConsent: boolean;
    ipAnonymization: boolean;
  };
  security: {
    encryptAtRest: boolean;
    encryptInTransit: boolean;
    anonymizePersonalData: boolean;
    maskSensitiveInfo: boolean;
  };
}

export default function PrivacyPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    dataRetention: {
      conversationDays: 30,
      analyticsMonths: 6,
      autoDelete: true,
    },
    userRights: {
      allowOptOut: true,
      showPrivacyNotice: true,
      requireConsent: false,
      allowDataExport: true,
      allowDataDeletion: true,
    },
    compliance: {
      gdprEnabled: true,
      ccpaEnabled: true,
      cookieConsent: true,
      ipAnonymization: true,
    },
    security: {
      encryptAtRest: true,
      encryptInTransit: true,
      anonymizePersonalData: false,
      maskSensitiveInfo: true,
    },
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSave = async () => {
    setSaveStatus('saving');
    
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const updateSettings = (category: keyof PrivacySettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Privacy & Data Protection</h1>
        </div>
        <p className="text-muted-foreground">
          Configure data retention, user privacy rights, and compliance settings
        </p>
      </div>

      {/* Compliance Status Banner */}
      <Alert className="mb-6">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Compliance Status</AlertTitle>
        <AlertDescription>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              GDPR Ready
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              CCPA Compliant
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              SOC2 Type II
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="retention" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="rights">User Rights</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Data Retention Tab */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Retention Policies
              </CardTitle>
              <CardDescription>
                Control how long data is stored before automatic deletion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="conversation-retention">Chat Conversation History</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Select
                    value={settings.dataRetention.conversationDays.toString()}
                    onValueChange={(value) => 
                      updateSettings('dataRetention', 'conversationDays', parseInt(value))
                    }
                  >
                    <SelectTrigger id="conversation-retention" className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Conversations older than this will be automatically deleted
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="analytics-retention">Analytics Data</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Select
                    value={settings.dataRetention.analyticsMonths.toString()}
                    onValueChange={(value) => 
                      updateSettings('dataRetention', 'analyticsMonths', parseInt(value))
                    }
                  >
                    <SelectTrigger id="analytics-retention" className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 month</SelectItem>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Aggregated analytics older than this will be archived
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Data Deletion</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically delete data when retention period expires
                  </p>
                </div>
                <Switch
                  checked={settings.dataRetention.autoDelete}
                  onCheckedChange={(checked) => 
                    updateSettings('dataRetention', 'autoDelete', checked)
                  }
                />
              </div>

              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  <strong>Next scheduled deletion:</strong> Tomorrow at 2:00 AM UTC
                  <br />
                  <span className="text-xs">243 conversations and 1,892 analytics records will be removed</span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Rights Tab */}
        <TabsContent value="rights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                User Privacy Rights
              </CardTitle>
              <CardDescription>
                Enable privacy features for your website visitors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Allow Opt-Out
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show "Your data is never sold" message and opt-out toggle in widget
                  </p>
                </div>
                <Switch
                  checked={settings.userRights.allowOptOut}
                  onCheckedChange={(checked) => 
                    updateSettings('userRights', 'allowOptOut', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Privacy Notice</Label>
                  <p className="text-sm text-muted-foreground">
                    Display privacy policy link in widget footer
                  </p>
                </div>
                <Switch
                  checked={settings.userRights.showPrivacyNotice}
                  onCheckedChange={(checked) => 
                    updateSettings('userRights', 'showPrivacyNotice', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Explicit Consent</Label>
                  <p className="text-sm text-muted-foreground">
                    Ask for consent before starting conversation
                  </p>
                </div>
                <Switch
                  checked={settings.userRights.requireConsent}
                  onCheckedChange={(checked) => 
                    updateSettings('userRights', 'requireConsent', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Allow Data Export
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Users can request a copy of their conversation history
                  </p>
                </div>
                <Switch
                  checked={settings.userRights.allowDataExport}
                  onCheckedChange={(checked) => 
                    updateSettings('userRights', 'allowDataExport', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Allow Data Deletion
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Users can request deletion of their data
                  </p>
                </div>
                <Switch
                  checked={settings.userRights.allowDataDeletion}
                  onCheckedChange={(checked) => 
                    updateSettings('userRights', 'allowDataDeletion', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Privacy Notice Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
                {settings.userRights.showPrivacyNotice && (
                  <p className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    <a href="#" className="underline">Privacy Policy</a>
                  </p>
                )}
                {settings.userRights.allowOptOut && (
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      Your data is never sold
                    </p>
                    <button className="text-xs underline">Opt-out</button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional Compliance
              </CardTitle>
              <CardDescription>
                Enable compliance features for different regulations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>GDPR (European Union)</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable GDPR compliance features for EU visitors
                  </p>
                </div>
                <Switch
                  checked={settings.compliance.gdprEnabled}
                  onCheckedChange={(checked) => 
                    updateSettings('compliance', 'gdprEnabled', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>CCPA (California)</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable CCPA compliance for California residents
                  </p>
                </div>
                <Switch
                  checked={settings.compliance.ccpaEnabled}
                  onCheckedChange={(checked) => 
                    updateSettings('compliance', 'ccpaEnabled', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cookie Consent Banner</Label>
                  <p className="text-sm text-muted-foreground">
                    Show cookie consent before loading widget
                  </p>
                </div>
                <Switch
                  checked={settings.compliance.cookieConsent}
                  onCheckedChange={(checked) => 
                    updateSettings('compliance', 'cookieConsent', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>IP Anonymization</Label>
                  <p className="text-sm text-muted-foreground">
                    Anonymize IP addresses in analytics
                  </p>
                </div>
                <Switch
                  checked={settings.compliance.ipAnonymization}
                  onCheckedChange={(checked) => 
                    updateSettings('compliance', 'ipAnonymization', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure data encryption and security features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Encrypt Data at Rest</Label>
                  <p className="text-sm text-muted-foreground">
                    Use AES-256 encryption for stored data
                  </p>
                </div>
                <Switch
                  checked={settings.security.encryptAtRest}
                  onCheckedChange={(checked) => 
                    updateSettings('security', 'encryptAtRest', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Encrypt Data in Transit</Label>
                  <p className="text-sm text-muted-foreground">
                    Force TLS 1.3 for all connections
                  </p>
                </div>
                <Switch
                  checked={settings.security.encryptInTransit}
                  onCheckedChange={(checked) => 
                    updateSettings('security', 'encryptInTransit', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Anonymize Personal Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Replace names and emails with anonymous IDs
                  </p>
                </div>
                <Switch
                  checked={settings.security.anonymizePersonalData}
                  onCheckedChange={(checked) => 
                    updateSettings('security', 'anonymizePersonalData', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    Mask Sensitive Information
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect and mask SSN, credit cards, etc.
                  </p>
                </div>
                <Switch
                  checked={settings.security.maskSensitiveInfo}
                  onCheckedChange={(checked) => 
                    updateSettings('security', 'maskSensitiveInfo', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="min-w-32"
        >
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Saved
            </>
          )}
          {saveStatus === 'idle' && 'Save Changes'}
          {saveStatus === 'error' && 'Try Again'}
        </Button>
      </div>
    </div>
  );
}