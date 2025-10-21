"use client";

import { useCallback, useEffect, useState } from "react";
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
  Archive,
  Save,
  RotateCcw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGdprExport } from "@/hooks/use-gdpr-export";
import { useGdprDelete } from "@/hooks/use-gdpr-delete";
import { AuditDetailModal } from "@/components/ui/audit-detail-modal";

type RequestField = 'domain' | 'sessionId' | 'email' | 'confirm';

const AUDIT_PAGE_SIZE = 25;
const ACTOR_HEADER = 'dashboard-privacy';

function toDateISOString(value: string, mode: 'start' | 'end'): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (mode === 'start') {
    date.setUTCHours(0, 0, 0, 0);
  } else {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date.toISOString();
}

const DEFAULT_PRIVACY_SETTINGS = {
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
};

// Mock data for audit log
type AuditEntry = {
  id: string;
  domain: string;
  request_type: "export" | "delete";
  session_id: string | null;
  email: string | null;
  actor: string | null;
  status: string;
  deleted_count: number | null;
  message: string | null;
  created_at: string;
};

export default function PrivacyPage() {
  const [isDirty, setIsDirty] = useState(false);
  const [settings, setSettings] = useState({ ...DEFAULT_PRIVACY_SETTINGS });
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<AuditEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialRequestState = {
    domain: '',
    sessionId: '',
    email: '',
    confirm: false,
  };

  const [requestForm, setRequestForm] = useState(initialRequestState);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { loading: exportLoading, error: exportError, download } = useGdprExport();
  const {
    loading: deleteLoading,
    error: deleteError,
    deletedCount,
    remove,
  } = useGdprDelete();
  const combinedError = exportError || deleteError;
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditCount, setAuditCount] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<'all' | 'export' | 'delete'>('all');
  const [auditOptionsLoading, setAuditOptionsLoading] = useState(false);
  const [auditOptionsError, setAuditOptionsError] = useState<string | null>(null);
  const [availableAuditDomains, setAvailableAuditDomains] = useState<string[]>([]);
  const [availableAuditActors, setAvailableAuditActors] = useState<string[]>([]);
  const [auditDomain, setAuditDomain] = useState('');
  const [auditActor, setAuditActor] = useState('');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const [auditExportLoading, setAuditExportLoading] = useState(false);
  const [auditExportError, setAuditExportError] = useState<string | null>(null);
  const handleSettingChange = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    console.log("Saving privacy settings:", settings);
    setIsDirty(false);
  };

  const handleReset = () => {
    setIsDirty(false);
    setSettings({ ...DEFAULT_PRIVACY_SETTINGS });
    setRequestForm(initialRequestState);
    setSuccessMessage(null);
    setAuditFilter('all');
    setAuditDomain('');
    setAuditActor('');
    setAuditStartDate('');
    setAuditEndDate('');
    setAuditPage(0);
    setAuditEntries([]);
    setAuditCount(0);
    setAuditError(null);
    setAuditOptionsError(null);
    setAuditExportError(null);
  };

  const handleRequestChange = (key: RequestField, value: string | boolean) => {
    setRequestForm(prev => ({ ...prev, [key]: value }));
    setSuccessMessage(null);
  };

  const handleExportRequest = async () => {
    const success = await download({
      domain: requestForm.domain.trim(),
      sessionId: requestForm.sessionId.trim() || undefined,
      email: requestForm.email.trim() || undefined,
      actor: ACTOR_HEADER,
    });

    if (success) {
      setSuccessMessage('Export started. A JSON file will download shortly.');
      await fetchAuditLog();
    }
  };

  const handleDeleteRequest = async () => {
    const count = await remove({
      domain: requestForm.domain.trim(),
      sessionId: requestForm.sessionId.trim() || undefined,
      email: requestForm.email.trim() || undefined,
      confirm: requestForm.confirm,
      actor: ACTOR_HEADER,
    });

    if (typeof count === 'number') {
      setSuccessMessage(
        count === 0
          ? 'No conversations matched the deletion request.'
          : `Deleted ${count} conversation${count === 1 ? '' : 's'} for the requested user.`,
      );
      setRequestForm(prev => ({ ...prev, confirm: false }));
      await fetchAuditLog();
    }
  };

  const fetchAuditLog = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const params = new URLSearchParams();
      if (auditFilter !== 'all') {
        params.set('request_type', auditFilter);
      }
      if (auditDomain.trim()) {
        params.set('domain', auditDomain.trim());
      }
      if (auditActor.trim()) {
        params.set('actor', auditActor.trim());
      }
      const startIso = toDateISOString(auditStartDate, 'start');
      if (startIso) {
        params.set('start_date', startIso);
      }
      const endIso = toDateISOString(auditEndDate, 'end');
      if (endIso) {
        params.set('end_date', endIso);
      }
      params.set('limit', AUDIT_PAGE_SIZE.toString());
      params.set('offset', String(auditPage * AUDIT_PAGE_SIZE));

      const url = params.toString().length > 0 ? `/api/gdpr/audit?${params.toString()}` : '/api/gdpr/audit';
      const response = await fetch(url);
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? 'Failed to load audit log');
      }
      const payload = await response.json();
      setAuditEntries(payload.entries ?? []);
      setAuditCount(typeof payload.count === 'number' ? payload.count : (payload.entries ?? []).length);
    } catch (err) {
      setAuditError((err as Error).message);
      setAuditEntries([]);
      setAuditCount(0);
    } finally {
      setAuditLoading(false);
    }
  }, [auditFilter, auditDomain, auditActor, auditStartDate, auditEndDate, auditPage]);

  const fetchAuditOptions = useCallback(async () => {
    setAuditOptionsLoading(true);
    setAuditOptionsError(null);
    try {
      const response = await fetch('/api/gdpr/audit/options');
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? 'Failed to load audit filter options');
      }
      const payload = await response.json();
      setAvailableAuditDomains(Array.isArray(payload.domains) ? payload.domains : []);
      setAvailableAuditActors(Array.isArray(payload.actors) ? payload.actors : []);
    } catch (err) {
      setAuditOptionsError((err as Error).message);
      setAvailableAuditDomains([]);
      setAvailableAuditActors([]);
    } finally {
      setAuditOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  useEffect(() => {
    fetchAuditOptions();
  }, [fetchAuditOptions]);

  const handleAuditExport = useCallback(async () => {
    setAuditExportLoading(true);
    setAuditExportError(null);
    try {
      const params = new URLSearchParams();
      if (auditFilter !== 'all') {
        params.set('request_type', auditFilter);
      }
      if (auditDomain.trim()) {
        params.set('domain', auditDomain.trim());
      }
      if (auditActor.trim()) {
        params.set('actor', auditActor.trim());
      }
      const startIso = toDateISOString(auditStartDate, 'start');
      if (startIso) {
        params.set('start_date', startIso);
      }
      const endIso = toDateISOString(auditEndDate, 'end');
      if (endIso) {
        params.set('end_date', endIso);
      }
      params.set('format', 'csv');
      params.set('limit', '5000');

      const url = `/api/gdpr/audit?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        const maybeJson = await response.json().catch(() => null);
        const message = maybeJson && typeof maybeJson.error === 'string'
          ? maybeJson.error
          : 'Failed to export audit log.';
        throw new Error(message);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `gdpr-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      setSuccessMessage('GDPR audit CSV download started.');
    } catch (err) {
      setAuditExportError((err as Error).message);
    } finally {
      setAuditExportLoading(false);
    }
  }, [auditActor, auditDomain, auditEndDate, auditFilter, auditStartDate]);

  const auditStart = auditEntries.length === 0 ? 0 : auditPage * AUDIT_PAGE_SIZE + 1;
  const auditEnd = auditEntries.length === 0 ? 0 : auditStart + auditEntries.length - 1;

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
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label>Customer Domain</Label>
                    <Input
                      value={requestForm.domain}
                      onChange={(event) => handleRequestChange('domain', event.target.value)}
                      placeholder="e.g. acme.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Session ID</Label>
                      <Input
                        value={requestForm.sessionId}
                        onChange={(event) => handleRequestChange('sessionId', event.target.value)}
                        placeholder="visitor-session-123"
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide a session ID or email to locate the user
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        value={requestForm.email}
                        onChange={(event) => handleRequestChange('email', event.target.value)}
                        placeholder="customer@example.com"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="space-y-0.5">
                      <Label>Confirm deletion request</Label>
                      <p className="text-xs text-muted-foreground">
                        Toggle on to acknowledge the user has confirmed deletion
                      </p>
                    </div>
                    <Switch
                      checked={requestForm.confirm}
                      onCheckedChange={(checked) => handleRequestChange('confirm', checked)}
                    />
                  </div>

                  {combinedError && (
                    <Alert variant="destructive">
                      <AlertDescription>{combinedError}</AlertDescription>
                    </Alert>
                  )}

                  {successMessage && (
                    <Alert>
                      <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={handleExportRequest}
                      disabled={exportLoading || deleteLoading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {exportLoading ? 'Exporting…' : 'Export User Data'}
                    </Button>
                    <Button
                      onClick={handleDeleteRequest}
                      variant="destructive"
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteLoading ? 'Processing…' : 'Delete User Data'}
                    </Button>
                  </div>

                  {deletedCount !== null && (
                    <p className="text-xs text-muted-foreground text-right">
                      Last deletion removed {deletedCount} conversation{deletedCount === 1 ? '' : 's'}.
                    </p>
                  )}
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
                GDPR Audit Log
              </CardTitle>
              <CardDescription>
                Export/delete history sourced from Supabase `gdpr_audit_log`
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="audit-domain">Domain</Label>
                    <Select
                      value={auditDomain || 'all'}
                      onValueChange={(value) => {
                        const nextDomain = value === 'all' ? '' : value;
                        setAuditDomain(nextDomain);
                        setAuditPage(0);
                      }}
                    >
                      <SelectTrigger id="audit-domain" disabled={auditOptionsLoading}>
                        <SelectValue placeholder={auditOptionsLoading ? 'Loading domains…' : 'All domains'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All domains</SelectItem>
                        {availableAuditDomains.map((domain) => (
                          <SelectItem key={domain} value={domain}>
                            {domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audit-actor">Actor</Label>
                    <Select
                      value={auditActor || 'all'}
                      onValueChange={(value) => {
                        const nextActor = value === 'all' ? '' : value;
                        setAuditActor(nextActor);
                        setAuditPage(0);
                      }}
                    >
                      <SelectTrigger id="audit-actor" disabled={auditOptionsLoading}>
                        <SelectValue placeholder={auditOptionsLoading ? 'Loading actors…' : 'All actors'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All actors</SelectItem>
                        {availableAuditActors.map((actor) => (
                          <SelectItem key={actor} value={actor}>
                            {actor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="audit-start-date">Start date</Label>
                    <Input
                      id="audit-start-date"
                      type="date"
                      value={auditStartDate}
                      max={auditEndDate || undefined}
                      onChange={(event) => {
                        setAuditStartDate(event.target.value);
                        setAuditPage(0);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audit-end-date">End date</Label>
                    <Input
                      id="audit-end-date"
                      type="date"
                      value={auditEndDate}
                      min={auditStartDate || undefined}
                      onChange={(event) => {
                        setAuditEndDate(event.target.value);
                        setAuditPage(0);
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Label>Filter</Label>
                    <div className="flex gap-2">
                      {(['all', 'export', 'delete'] as const).map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant={auditFilter === option ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setAuditFilter(option);
                            setAuditPage(0);
                          }}
                        >
                          {option === 'all' ? 'All' : option === 'export' ? 'Exports' : 'Deletions'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchAuditOptions()} disabled={auditOptionsLoading}>
                      Sync filters
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAuditExport}
                      disabled={auditExportLoading}
                    >
                      {auditExportLoading ? 'Exporting…' : 'Export CSV'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fetchAuditLog()} disabled={auditLoading}>
                      Refresh
                    </Button>
                  </div>
                </div>

                {auditOptionsError && (
                  <Alert variant="destructive">
                    <AlertDescription>{auditOptionsError}</AlertDescription>
                  </Alert>
                )}

                {auditExportError && (
                  <Alert variant="destructive">
                    <AlertDescription>{auditExportError}</AlertDescription>
                  </Alert>
                )}

                {auditError && (
                  <Alert variant="destructive">
                    <AlertDescription>{auditError}</AlertDescription>
                  </Alert>
                )}

                {auditLoading ? (
                  <p className="text-sm text-muted-foreground">Loading audit entries…</p>
                ) : auditEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No audit entries found for the selected filters.</p>
                ) : (
                  <div className="space-y-4">
                    {auditEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedAuditEntry(entry);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={entry.request_type === 'export' ? 'secondary' : 'destructive'}>
                              {entry.request_type === 'export' ? 'Export' : 'Delete'}
                            </Badge>
                            <Badge
                              variant={
                                entry.status === 'completed'
                                  ? 'default'
                                  : entry.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {entry.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium">
                            {entry.message ?? 'Processed GDPR request'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Actor: {entry.actor ?? 'Dashboard'} • Domain: {entry.domain}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Identifier: {entry.email ?? entry.session_id ?? 'Unspecified'}
                          </p>
                          {typeof entry.deleted_count === 'number' && entry.request_type === 'delete' && (
                            <p className="text-xs text-muted-foreground">
                              Deleted conversations: {entry.deleted_count}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="ml-2">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {auditEntries.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {auditStart}-{auditEnd} of {auditCount} entries
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditPage((page) => Math.max(page - 1, 0))}
                        disabled={auditPage === 0 || auditLoading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditPage((page) => page + 1)}
                        disabled={(auditPage + 1) * AUDIT_PAGE_SIZE >= auditCount || auditLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
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

      {/* Audit Detail Modal */}
      <AuditDetailModal
        entry={selectedAuditEntry}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAuditEntry(null);
        }}
      />
    </div>
  );
}
