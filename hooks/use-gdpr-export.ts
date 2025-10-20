import { useCallback, useState } from 'react';

interface GdprExportOptions {
  domain: string;
  sessionId?: string;
  email?: string;
  actor?: string;
}

export function useGdprExport(): {
  loading: boolean;
  error: string | null;
  download: (options: GdprExportOptions) => Promise<boolean>;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(async ({ domain, sessionId, email, actor }: GdprExportOptions) => {
    if (!domain || (!sessionId && !email)) {
      setError('Domain and either session ID or email are required.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor': actor ?? 'dashboard',
        },
        body: JSON.stringify({
          domain,
          session_id: sessionId,
          email,
        }),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? 'Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, download };
}
