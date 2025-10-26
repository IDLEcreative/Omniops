"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserX, Download, Trash2 } from "lucide-react";
import { useGdprExport } from "@/hooks/use-gdpr-export";
import { useGdprDelete } from "@/hooks/use-gdpr-delete";
import type { PrivacySettings, GdprRequestForm, RequestField } from "@/types/privacy";
import { ACTOR_HEADER } from "@/types/privacy";

interface DataExportSectionProps {
  settings: PrivacySettings;
  requestForm: GdprRequestForm;
  successMessage: string | null;
  onSettingChange: (key: string, value: boolean) => void;
  onRequestChange: (key: RequestField, value: string | boolean) => void;
  onSuccess: (message: string) => void;
  onAuditRefresh: () => Promise<void>;
}

export function DataExportSection({
  settings,
  requestForm,
  successMessage,
  onSettingChange,
  onRequestChange,
  onSuccess,
  onAuditRefresh,
}: DataExportSectionProps) {
  const { loading: exportLoading, error: exportError, download } = useGdprExport();
  const {
    loading: deleteLoading,
    error: deleteError,
    deletedCount,
    remove,
  } = useGdprDelete();

  const combinedError = exportError || deleteError;

  const handleExportRequest = async () => {
    const success = await download({
      domain: requestForm.domain.trim(),
      sessionId: requestForm.sessionId.trim() || undefined,
      email: requestForm.email.trim() || undefined,
      actor: ACTOR_HEADER,
    });

    if (success) {
      onSuccess('Export started. A JSON file will download shortly.');
      await onAuditRefresh();
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
      onSuccess(
        count === 0
          ? 'No conversations matched the deletion request.'
          : `Deleted ${count} conversation${count === 1 ? '' : 's'} for the requested user.`,
      );
      onRequestChange('confirm', false);
      await onAuditRefresh();
    }
  };

  return (
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
            onCheckedChange={(checked) => onSettingChange('rightToForgotten', checked)}
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
            onCheckedChange={(checked) => onSettingChange('dataPortability', checked)}
          />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <Label>Customer Domain</Label>
            <Input
              value={requestForm.domain}
              onChange={(event) => onRequestChange('domain', event.target.value)}
              placeholder="e.g. acme.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Session ID</Label>
              <Input
                value={requestForm.sessionId}
                onChange={(event) => onRequestChange('sessionId', event.target.value)}
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
                onChange={(event) => onRequestChange('email', event.target.value)}
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
              onCheckedChange={(checked) => onRequestChange('confirm', checked)}
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
  );
}
