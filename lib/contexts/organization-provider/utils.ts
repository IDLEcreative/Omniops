/**
 * Organization Provider Utilities
 */

import { useMemo } from 'react';
import type { OrganizationPermissions } from '../organization-types';
import { CacheManager, CACHE_CONFIG } from '../organization-cache';

export function useComputedPermissions(
  currentUserRole: string | null,
  cache: CacheManager<any>
): OrganizationPermissions {
  return useMemo(() => {
    const cacheKey = `permissions-${currentUserRole}`;

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const perms = {
      canInviteMembers: ['owner', 'admin'].includes(currentUserRole || ''),
      canManageOrganization: ['owner', 'admin'].includes(currentUserRole || ''),
      canDeleteOrganization: currentUserRole === 'owner',
      canViewBilling: ['owner', 'admin'].includes(currentUserRole || ''),
    };

    cache.set(cacheKey, perms, CACHE_CONFIG.PERMISSIONS_TTL);
    return perms;
  }, [currentUserRole, cache]);
}
