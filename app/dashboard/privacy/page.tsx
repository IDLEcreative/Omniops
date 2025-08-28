"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Clock,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  Key,
  Activity,
  Globe,
  UserX,
  Calendar,
  Archive,
  Settings,
  Save,
  RotateCcw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mock data for audit log
const auditLogData = [
  {
    id: 1,
    action: "Data Export Requested",
    user: "admin@company.com",
    timestamp: "2025-01-15 14:30:22",
    details: "Full customer data export",
    status: "completed",
  },
  {
    id: 2,
    action: "Privacy Settings Updated",
    user: "admin@company.com",
    timestamp: "2025-01-15 12:15:45",
    details: "Cookie consent banner enabled",
    status: "completed",
  },
  {
    id: 3,
    action: "Data Deletion Request",
    user: "customer@example.com",
    timestamp: "2025-01-14 16:45:12",
    details: "User ID: 12345 - All personal data",
    status: "pending",
  },
  {
    id: 4,
    action: "Security Audit",
    user: "system",
    timestamp: "2025-01-14 09:00:00",
    details: "Automated security compliance check",
    status: "completed",
  },
];

export default function PrivacyPage() {
  const [isDirty, setIsDirty] = useState(false);
  const [settings, setSettings] = useState({
    // Data Retention
    chatRetentionDays: "365",
    archiveAfterDays: "90",
    autoDeleteInactive: true,
    
    // GDPR Compliance
    cookieConsent: true,
    dataProcessingConsent: true,
    rightToForgotten: true,
    dataPortability: true,
    consentRecords: true,
    
    // Security Settings
    encryptionAtRest: true,
    encryptionInTransit: true,
    anonymizeIPs: true,
    secureHeaders: true,
    auditLogging: true,
    
    // Privacy Features
    dataMinimization: true,
    pseudonymization: false,
    purposeLimitation: true,
    storageMinimization: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    console.log("Saving privacy settings:", settings);
    setIsDirty(false);
  };

  const handleReset = () => {
    setIsDirty(false);
  };

  const handleDataExport = () => {
    console.log("Initiating data export...");
  };

  const handleDataDeletion = () => {
    console.log("Initiating data deletion...");
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
                    onChange={(e) => handleSettingChange('chatRetentionDays', e.target.value)}
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
                    onChange={(e) => handleSettingChange('archiveAfterDays', e.target.value)}
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
                    onCheckedChange={(checked) => handleSettingChange('autoDeleteInactive', checked)}
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
        </TabsContent>

        {/* GDPR Compliance */}
        <TabsContent value="gdpr" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    onCheckedChange={(checked) => handleSettingChange('cookieConsent', checked)}
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
                    onCheckedChange={(checked) => handleSettingChange('dataProcessingConsent', checked)}
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
                    onCheckedChange={(checked) => handleSettingChange('consentRecords', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserX className="h-5 w-5 mr-2" />
                  User Rights Management
                </CardTitle>
                <CardDescription>
                  Data export and deletion capabilities for users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Right to be Forgotten</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to request complete data deletion
                    </p>
                  </div>
                  <Switch
                    checked={settings.rightToForgotten}
                    onCheckedChange={(checked) => handleSettingChange('rightToForgotten', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Portability</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable users to export their personal data
                    </p>
                  </div>
                  <Switch
                    checked={settings.dataPortability}
                    onCheckedChange={(checked) => handleSettingChange('dataPortability', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Button onClick={handleDataExport} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export All User Data
                  </Button>
                  <Button onClick={handleDataDeletion} variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Process Deletion Requests
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle>GDPR Compliance Status</CardTitle>
              <CardDescription>
                Current compliance status and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Consent Management</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Compliant
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Retention Policies</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Compliant
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Right to Access</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Compliant
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Protection Officer</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Review
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Privacy Impact Assessment</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Review
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cross-border Transfers</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Compliant
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Consider appointing a Data Protection Officer for full compliance.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
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
                    onCheckedChange={(checked) => handleSettingChange('anonymizeIPs', checked)}
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
                    onCheckedChange={(checked) => handleSettingChange('secureHeaders', checked)}
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
                    onCheckedChange={(checked) => handleSettingChange('dataMinimization', checked)}
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
                    onCheckedChange={(checked) => handleSettingChange('pseudonymization', checked)}
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
                    onCheckedChange={(checked) => handleSettingChange('purposeLimitation', checked)}
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
                    onCheckedChange={(checked) => handleSettingChange('storageMinimization', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Status Overview */}
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
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Security Audit Log
              </CardTitle>
              <CardDescription>
                Recent privacy and security related activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogData.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`h-2 w-2 rounded-full ${
                          entry.status === 'completed' ? 'bg-green-500' :
                          entry.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">{entry.action}</span>
                        <Badge variant={
                          entry.status === 'completed' ? 'default' :
                          entry.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {entry.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {entry.details}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        By {entry.user} • {entry.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing 4 of 247 audit entries
                </p>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Log
                  </Button>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Subject Requests</CardTitle>
                <CardDescription>
                  Manage user privacy requests quickly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>User Email or ID</Label>
                  <Input placeholder="user@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>
                  Recent security events requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed login attempts</span>
                    <Badge variant="outline">3 today</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Unusual IP access</span>
                    <Badge variant="destructive">1 active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SSL certificate</span>
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}