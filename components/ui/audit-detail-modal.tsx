'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, CheckCircle, Calendar, User, Globe, Hash, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditEntry {
  id: string;
  domain: string;
  request_type: 'export' | 'delete';
  session_id: string | null;
  email: string | null;
  actor: string | null;
  status: string;
  deleted_count: number | null;
  message: string | null;
  created_at: string;
  // Future field for full payload
  payload?: Record<string, any>;
}

interface AuditDetailModalProps {
  entry: AuditEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDetailModal({ entry, isOpen, onClose }: AuditDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  // Construct the full audit data object for display
  const fullData = {
    id: entry.id,
    domain: entry.domain,
    request_type: entry.request_type,
    session_id: entry.session_id,
    email: entry.email,
    actor: entry.actor,
    status: entry.status,
    deleted_count: entry.deleted_count,
    message: entry.message,
    created_at: entry.created_at,
    // Include payload if available
    ...(entry.payload && { payload: entry.payload }),
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(fullData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gdpr-audit-${entry.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Audit Entry Details
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
          </DialogTitle>
          <DialogDescription>
            Full details of GDPR audit entry {entry.id}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="summary" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
            {entry.payload && <TabsTrigger value="payload">Request Payload</TabsTrigger>}
          </TabsList>

          <TabsContent value="summary" className="space-y-4 overflow-y-auto max-h-[50vh]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">ID:</span>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">{entry.id}</code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span>{formatDate(entry.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Actor:</span>
                  <span>{entry.actor || 'Dashboard'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Domain:</span>
                  <span>{entry.domain}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Identifier:</span>
                  <span>{entry.email || entry.session_id || 'Unspecified'}</span>
                </div>
                {entry.deleted_count !== null && entry.request_type === 'delete' && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Deleted Count:</span>
                    <span>{entry.deleted_count} conversations</span>
                  </div>
                )}
              </div>
            </div>

            {entry.message && (
              <div className="border-t pt-4">
                <p className="font-medium text-sm mb-2">Message</p>
                <p className="text-sm text-muted-foreground">{entry.message}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="font-medium text-sm mb-2">Compliance Notes</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Request processed in accordance with GDPR Article {entry.request_type === 'export' ? '15' : '17'}</li>
                <li>Audit trail preserved for compliance verification</li>
                <li>Retention period: 2 years from creation date</li>
                <li>Auto-deletion scheduled for {formatDate(new Date(new Date(entry.created_at).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString())}</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="raw" className="overflow-y-auto max-h-[50vh]">
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
              <code>{JSON.stringify(fullData, null, 2)}</code>
            </pre>
          </TabsContent>

          {entry.payload && (
            <TabsContent value="payload" className="overflow-y-auto max-h-[50vh]">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                <code>{JSON.stringify(entry.payload, null, 2)}</code>
              </pre>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="default" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}