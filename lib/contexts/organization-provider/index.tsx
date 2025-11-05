/**
 * Organization Context - React Provider
 *
 * Provides organization state management, caching, and real-time updates.
 * Manages current organization selection, user memberships, permissions, and seat usage.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import type { Organization, OrganizationContextType } from '../organization-types';
import { CacheManager, CACHE_CONFIG } from '../organization-cache';
import { useOrganizationData, useOrganizationActions, useOrganizationSwitch } from './hooks';
import { useComputedPermissions } from './utils';

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const cache = useMemo(() => new CacheManager<any>(), []);
  const hasInitializedRef = useRef(false);

  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const {
    userOrganizations,
    isLoadingOrganizations,
    seatUsage,
    loadUserOrganizations,
    loadSeatUsage
  } = useOrganizationData(cache);

  const { switchOrganization } = useOrganizationSwitch(
    cache,
    userOrganizations,
    setCurrentOrganization,
    setCurrentUserRole,
    loadSeatUsage
  );

  const {
    createOrganization,
    inviteMember: inviteMemberAction,
    refreshOrganizations,
    refreshSeatUsage: refreshSeatUsageAction
  } = useOrganizationActions(cache, loadUserOrganizations, loadSeatUsage);

  const permissions = useComputedPermissions(currentUserRole, cache);

  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  const inviteMember = useCallback(async (email: string, role: string) => {
    return inviteMemberAction(currentOrganization, email, role);
  }, [currentOrganization, inviteMemberAction]);

  const refreshSeatUsage = useCallback(async () => {
    return refreshSeatUsageAction(currentOrganization);
  }, [currentOrganization, refreshSeatUsageAction]);

  // Initial load - runs only once on mount via useRef flag
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    loadUserOrganizations().then((orgs: Organization[]) => {
      const savedOrgId = localStorage.getItem('current-organization-id');
      if (savedOrgId && orgs.some((o: Organization) => o.id === savedOrgId)) {
        switchOrganization(savedOrgId);
      } else if (!currentOrganization && orgs.length > 0 && orgs[0]) {
        switchOrganization(orgs[0].id);
      }
    });
  }, [currentOrganization, loadUserOrganizations, switchOrganization]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentOrganization) return;

    const channel = supabase
      .channel(`organization-${currentOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_members',
          filter: `organization_id=eq.${currentOrganization.id}`
        },
        () => {
          cache.clear(`seat-usage-${currentOrganization.id}`);
          refreshSeatUsage();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_invitations',
          filter: `organization_id=eq.${currentOrganization.id}`
        },
        () => {
          cache.clear(`seat-usage-${currentOrganization.id}`);
          refreshSeatUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization, supabase, cache, refreshSeatUsage]);

  const value: OrganizationContextType = {
    currentOrganization,
    setCurrentOrganization,
    userOrganizations,
    isLoadingOrganizations,
    currentUserRole,
    seatUsage,
    switchOrganization,
    refreshOrganizations,
    refreshSeatUsage,
    createOrganization,
    inviteMember,
    permissions,
    clearCache,
    cacheExpiry: CACHE_CONFIG.ORGANIZATIONS_TTL
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
