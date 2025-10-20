import { useCallback, useState } from 'react';

interface GdprDeleteOptions {
  domain: string;
  sessionId?: string;
  email?: string;
  confirm: boolean;
  actor?: string;
}

export function useGdprDelete(): {
  loading: boolean;
  error: string | null;
  deletedCount: number | null;
  remove: (options: GdprDeleteOptions) => Promise<number | null>;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

  const remove = useCallback(
    async ({ domain, sessionId, email, confirm, actor }: GdprDeleteOptions) => {
      if (!confirm) {
        setError('Please confirm the deletion request.');
        return null;
      }

      if (!domain || (!sessionId && !email)) {
        setError('Domain and either session ID or email are required.');
        return null;
      }

      setLoading(true);
      setError(null);
      setDeletedCount(null);

      try {
        const response = await fetch('/api/gdpr/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-actor': actor ?? 'dashboard',
          },
          body: JSON.stringify({
            domain,
            session_id: sessionId,
            email,
            confirm,
          }),
        });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? 'Failed to delete data');
      }

      const payload = await response.json();
      setDeletedCount(payload.deleted_count ?? 0);
      return payload.deleted_count ?? 0;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
    },
    [],
  );

  return { loading, error, deletedCount, remove };
}
