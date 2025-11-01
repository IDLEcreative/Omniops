/**
 * Organization Context - React Provider
 *
 * Provides organization state management, caching, and real-time updates.
 * Manages current organization selection, user memberships, permissions, and seat usage.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import type { Organization, OrganizationContextType } from '../organization-types';
import { CacheManager, CACHE_CONFIG } from '../organization-cache';
import { useOrganizationData, useOrganizationActions, useOrganizationSwitch } from './hooks';
import { useComputedPermissions } from './utils';

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient<Database>();
  const cache = useMemo(() => new CacheManager<any>(), []);

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

  // Initial load
  useEffect(() => {
    loadUserOrganizations().then(orgs => {
      const savedOrgId = localStorage.getItem('current-organization-id');
      if (savedOrgId && orgs.some(o => o.id === savedOrgId)) {
        switchOrganization(savedOrgId);
      } else if (!currentOrganization && orgs.length > 0 && orgs[0]) {
        switchOrganization(orgs[0].id);
      }
    });
  }, []);

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
