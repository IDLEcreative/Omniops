"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  plan_type: string;
  seat_limit: number;
  created_at: string;
  updated_at: string;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
}

interface OrganizationContextType {
  // Current organization
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;

  // User's organizations
  userOrganizations: Organization[];
  isLoadingOrganizations: boolean;

  // Current user's role
  currentUserRole: string | null;

  // Seat usage (cached)
  seatUsage: {
    used: number;
    pending: number;
    limit: number;
    available: number;
    lastUpdated: Date;
  } | null;

  // Actions
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  refreshSeatUsage: () => Promise<void>;
  createOrganization: (name: string) => Promise<Organization>;
  inviteMember: (email: string, role: string) => Promise<void>;

  // Permissions (cached and computed)
  permissions: {
    canInviteMembers: boolean;
    canManageOrganization: boolean;
    canDeleteOrganization: boolean;
    canViewBilling: boolean;
  };

  // Cache management
  clearCache: () => void;
  cacheExpiry: number; // milliseconds
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// Cache configuration
const CACHE_CONFIG = {
  ORGANIZATIONS_TTL: 5 * 60 * 1000, // 5 minutes
  SEAT_USAGE_TTL: 60 * 1000, // 1 minute
  PERMISSIONS_TTL: 2 * 60 * 1000, // 2 minutes
};

// In-memory cache with TTL
class CacheManager<T> {
  private cache: Map<string, { data: T; expires: number }> = new Map();

  set(key: string, data: T, ttl: number) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(pattern?: string) {
    if (pattern) {
      Array.from(this.cache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    const data = this.get(key);
    return data !== null;
  }
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const cache = useMemo(() => new CacheManager<any>(), []);

  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const [seatUsage, setSeatUsage] = useState<OrganizationContextType['seatUsage']>(null);

  // Load user's organizations with caching
  const loadUserOrganizations = useCallback(async (forceRefresh = false) => {
    try {
      const cacheKey = 'user-organizations';

      // Check cache first
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

      // Fetch organizations
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

      // Type assertion for Supabase query result
      type MembershipWithOrg = { role: string; organization: Organization | null };
      const typedMemberships = (memberships || []) as MembershipWithOrg[];

      const orgs = typedMemberships
        .map(m => m.organization)
        .filter((org): org is Organization => org !== null && org !== undefined);

      // Cache the result
      cache.set(cacheKey, orgs, CACHE_CONFIG.ORGANIZATIONS_TTL);
      setUserOrganizations(orgs);

      // Set current organization if not set
      if (!currentOrganization && orgs.length > 0 && orgs[0]) {
        await switchOrganization(orgs[0].id);
      }

      return orgs;
    } catch (error) {
      console.error('Error in loadUserOrganizations:', error);
      return [];
    } finally {
      setIsLoadingOrganizations(false);
    }
  }, [supabase, cache, currentOrganization]);

  // Load seat usage with caching
  const loadSeatUsage = useCallback(async (organizationId: string, forceRefresh = false) => {
    try {
      const cacheKey = `seat-usage-${organizationId}`;

      // Check cache first
      if (!forceRefresh && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        setSeatUsage(cached);
        return cached;
      }

      // Fetch fresh data
      const response = await fetch(`/api/organizations/${organizationId}/invitations`);
      if (!response.ok) throw new Error('Failed to fetch seat usage');

      const data = await response.json();
      const usage = {
        ...data.seat_usage,
        lastUpdated: new Date()
      };

      // Cache the result
      cache.set(cacheKey, usage, CACHE_CONFIG.SEAT_USAGE_TTL);
      setSeatUsage(usage);

      return usage;
    } catch (error) {
      console.error('Error loading seat usage:', error);
      return null;
    }
  }, [cache]);

  // Switch organization
  const switchOrganization = useCallback(async (organizationId: string) => {
    try {
      const org = userOrganizations.find(o => o.id === organizationId);
      if (!org) throw new Error('Organization not found');

      setCurrentOrganization(org);

      // Load user's role in this organization
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cacheKey = `user-role-${organizationId}-${user.id}`;

        // Check cache
        let role = cache.get(cacheKey);

        if (!role) {
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

          // Type assertion for membership data
          const typedMembership = membership as { role: string } | null;
          role = typedMembership?.role || null;
          cache.set(cacheKey, role, CACHE_CONFIG.PERMISSIONS_TTL);
        }

        setCurrentUserRole(role);
      }

      // Load seat usage for new organization
      await loadSeatUsage(organizationId);

      // Store in localStorage for persistence
      localStorage.setItem('current-organization-id', organizationId);
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  }, [userOrganizations, supabase, cache, loadSeatUsage]);

  // Computed permissions with caching
  const permissions = useMemo(() => {
    const cacheKey = `permissions-${currentUserRole}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const perms = {
      canInviteMembers: ['owner', 'admin'].includes(currentUserRole || ''),
      canManageOrganization: ['owner', 'admin'].includes(currentUserRole || ''),
      canDeleteOrganization: currentUserRole === 'owner',
      canViewBilling: ['owner', 'admin'].includes(currentUserRole || ''),
    };

    // Cache permissions
    cache.set(cacheKey, perms, CACHE_CONFIG.PERMISSIONS_TTL);
    return perms;
  }, [currentUserRole, cache]);

  // Create organization
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

    // Clear cache and reload
    cache.clear('user-organizations');
    await loadUserOrganizations(true);

    return organization;
  }, [cache, loadUserOrganizations]);

  // Invite member with seat limit check
  const inviteMember = useCallback(async (email: string, role: string) => {
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

    // Refresh seat usage after invitation
    cache.clear(`seat-usage-${currentOrganization.id}`);
    await loadSeatUsage(currentOrganization.id, true);
  }, [currentOrganization, cache, loadSeatUsage]);

  // Refresh functions
  const refreshOrganizations = useCallback(async () => {
    cache.clear('user-organizations');
    await loadUserOrganizations(true);
  }, [cache, loadUserOrganizations]);

  const refreshSeatUsage = useCallback(async () => {
    if (currentOrganization) {
      cache.clear(`seat-usage-${currentOrganization.id}`);
      await loadSeatUsage(currentOrganization.id, true);
    }
  }, [currentOrganization, cache, loadSeatUsage]);

  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  // Initial load
  useEffect(() => {
    loadUserOrganizations();

    // Load last selected organization
    const savedOrgId = localStorage.getItem('current-organization-id');
    if (savedOrgId && userOrganizations.some(o => o.id === savedOrgId)) {
      switchOrganization(savedOrgId);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentOrganization) return;

    // Subscribe to organization changes
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
          // Invalidate cache and refresh
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
          // Invalidate cache and refresh
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