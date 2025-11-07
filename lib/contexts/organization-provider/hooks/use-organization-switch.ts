/**
 * Organization Switching Hook
 */

import { useCallback, useMemo } from 'react';
import type { Database } from '@/types/supabase';
import type { Organization } from '../../organization-types';
import { CacheManager, CACHE_CONFIG } from '../../organization-cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

export function useOrganizationSwitch(
  cache: CacheManager<any>,
  userOrganizations: Organization[],
  setCurrentOrganization: (org: Organization | null) => void,
  setCurrentUserRole: (role: string | null) => void,
  loadSeatUsage: (organizationId: string, forceRefresh?: boolean) => Promise<any>
) {
  const supabase = useMemo(() => createSupabaseClient<Database>(), []);

  const switchOrganization = useCallback(async (organizationId: string) => {
    try {
      const org = userOrganizations.find(o => o.id === organizationId);
      if (!org) throw new Error('Organization not found');

      setCurrentOrganization(org);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cacheKey = `user-role-${organizationId}-${user.id}`;

        let role = cache.get(cacheKey);

        if (!role) {
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

          const typedMembership = membership as { role: string } | null;
          role = typedMembership?.role || null;
          cache.set(cacheKey, role, CACHE_CONFIG.PERMISSIONS_TTL);
        }

        setCurrentUserRole(role);
      }

      await loadSeatUsage(organizationId);

      localStorage.setItem('current-organization-id', organizationId);
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  }, [userOrganizations, supabase, cache, loadSeatUsage, setCurrentOrganization, setCurrentUserRole]);

  return { switchOrganization };
}
