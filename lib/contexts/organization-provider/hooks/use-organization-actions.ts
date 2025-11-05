/**
 * Organization Actions Hook
 */

import { useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import type { Organization } from '../../organization-types';
import { CacheManager } from '../../organization-cache';

export function useOrganizationActions(
  cache: CacheManager<any>,
  loadUserOrganizations: (forceRefresh?: boolean) => Promise<Organization[]>,
  loadSeatUsage: (organizationId: string, forceRefresh?: boolean) => Promise<any>
) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const createOrganization = useCallback(async (name: string): Promise<Organization> => {
    const response = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create organization');
    }

    const { organization } = await response.json();

    cache.clear('user-organizations');
    await loadUserOrganizations(true);

    return organization;
  }, [cache, loadUserOrganizations]);

  const inviteMember = useCallback(async (
    currentOrganization: Organization | null,
    email: string,
    role: string
  ) => {
    if (!currentOrganization) throw new Error('No organization selected');

    const response = await fetch(`/api/organizations/${currentOrganization.id}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send invitation');
    }

    cache.clear(`seat-usage-${currentOrganization.id}`);
    await loadSeatUsage(currentOrganization.id, true);
  }, [cache, loadSeatUsage]);

  const refreshOrganizations = useCallback(async () => {
    cache.clear('user-organizations');
    await loadUserOrganizations(true);
  }, [cache, loadUserOrganizations]);

  const refreshSeatUsage = useCallback(async (currentOrganization: Organization | null) => {
    if (currentOrganization) {
      cache.clear(`seat-usage-${currentOrganization.id}`);
      await loadSeatUsage(currentOrganization.id, true);
    }
  }, [cache, loadSeatUsage]);

  return {
    createOrganization,
    inviteMember,
    refreshOrganizations,
    refreshSeatUsage
  };
}
