/**
 * Organization Data Loading Hook
 */

import { useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import type { Organization, SeatUsage } from '../../organization-types';
import { CacheManager, CACHE_CONFIG } from '../../organization-cache';

export function useOrganizationData(cache: CacheManager<any>) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const [seatUsage, setSeatUsage] = useState<SeatUsage | null>(null);

  const loadUserOrganizations = useCallback(async (forceRefresh = false) => {
    try {
      const cacheKey = 'user-organizations';

      if (!forceRefresh && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        setUserOrganizations(cached);
        return cached;
      }

      setIsLoadingOrganizations(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserOrganizations([]);
        return [];
      }

      const { data: memberships, error } = await supabase
        .from('organization_members')
        .select(`
          role,
          organization:organizations (
            id,
            name,
            slug,
            settings,
            plan_type,
            seat_limit,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading organizations:', error);
        return [];
      }

      type MembershipWithOrg = { role: string; organization: Organization | null };
      const typedMemberships = (memberships || []) as MembershipWithOrg[];

      const orgs = typedMemberships
        .map(m => m.organization)
        .filter((org): org is Organization => org !== null && org !== undefined);

      cache.set(cacheKey, orgs, CACHE_CONFIG.ORGANIZATIONS_TTL);
      setUserOrganizations(orgs);

      return orgs;
    } catch (error) {
      console.error('Error in loadUserOrganizations:', error);
      return [];
    } finally {
      setIsLoadingOrganizations(false);
    }
  }, [supabase, cache]);

  const loadSeatUsage = useCallback(async (organizationId: string, forceRefresh = false) => {
    try {
      const cacheKey = `seat-usage-${organizationId}`;

      if (!forceRefresh && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        setSeatUsage(cached);
        return cached;
      }

      const response = await fetch(`/api/organizations/${organizationId}/invitations`);
      if (!response.ok) throw new Error('Failed to fetch seat usage');

      const data = await response.json();
      const usage = {
        ...data.seat_usage,
        lastUpdated: new Date()
      };

      cache.set(cacheKey, usage, CACHE_CONFIG.SEAT_USAGE_TTL);
      setSeatUsage(usage);

      return usage;
    } catch (error) {
      console.error('Error loading seat usage:', error);
      return null;
    }
  }, [cache]);

  return {
    userOrganizations,
    setUserOrganizations,
    isLoadingOrganizations,
    seatUsage,
    setSeatUsage,
    loadUserOrganizations,
    loadSeatUsage
  };
}
