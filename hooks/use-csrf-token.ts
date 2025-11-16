/**
 * React hook for managing CSRF tokens
 *
 * Automatically fetches and caches CSRF token on mount.
 * Use this hook in components that make authenticated API calls.
 */

'use client';

import { useEffect, useState } from 'react';
import { fetchCSRFToken } from '@/lib/csrf-client';

export function useCSRFToken() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeCSRF() {
      try {
        await fetchCSRFToken();
        if (mounted) {
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch CSRF token'));
          console.error('CSRF token initialization failed:', err);
        }
      }
    }

    initializeCSRF();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}
