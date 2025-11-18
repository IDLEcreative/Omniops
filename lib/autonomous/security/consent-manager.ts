/**
 * Autonomous Consent Manager
 *
 * Manages user consent for autonomous operations.
 * Ensures all autonomous actions have explicit user permission.
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConsentRequest, ConsentRecord, ConsentVerification } from './consent-types';
import {
  insertConsent as defaultInsertConsent,
  selectConsent as defaultSelectConsent,
  updateConsentRevoked as defaultUpdateConsentRevoked,
  updateConsentRevokedById as defaultUpdateConsentRevokedById,
  updateConsentExpiry as defaultUpdateConsentExpiry,
  bulkRevokeForService as defaultBulkRevokeForService,
  mapToConsentRecord as defaultMapToConsentRecord
} from './consent-operations';

export type { ConsentRequest, ConsentRecord, ConsentVerification } from './consent-types';
export {
  grantConsent,
  verifyConsent,
  revokeConsent,
  hasConsent
} from './consent-convenience';

// Interface for consent operations (for dependency injection)
export interface ConsentOperations {
  insertConsent: typeof defaultInsertConsent;
  selectConsent: typeof defaultSelectConsent;
  updateConsentRevoked: typeof defaultUpdateConsentRevoked;
  updateConsentRevokedById: typeof defaultUpdateConsentRevokedById;
  updateConsentExpiry: typeof defaultUpdateConsentExpiry;
  bulkRevokeForService: typeof defaultBulkRevokeForService;
  mapToConsentRecord: typeof defaultMapToConsentRecord;
}

export class ConsentManager {
  private supabase: SupabaseClient | null;
  private consentVersion: string;
  private operations: ConsentOperations;

  /**
   * Create ConsentManager instance
   * @param client Optional Supabase client (for testing). If not provided, creates one.
   * @param operations Optional consent operations (for testing). If not provided, uses defaults.
   */
  constructor(
    client?: SupabaseClient | null,
    operations?: Partial<ConsentOperations>
  ) {
    this.supabase = client || createServiceRoleClientSync();
    this.consentVersion = process.env.CONSENT_VERSION || '1.0';

    // Use provided operations or defaults
    this.operations = {
      insertConsent: operations?.insertConsent || defaultInsertConsent,
      selectConsent: operations?.selectConsent || defaultSelectConsent,
      updateConsentRevoked: operations?.updateConsentRevoked || defaultUpdateConsentRevoked,
      updateConsentRevokedById: operations?.updateConsentRevokedById || defaultUpdateConsentRevokedById,
      updateConsentExpiry: operations?.updateConsentExpiry || defaultUpdateConsentExpiry,
      bulkRevokeForService: operations?.bulkRevokeForService || defaultBulkRevokeForService,
      mapToConsentRecord: operations?.mapToConsentRecord || defaultMapToConsentRecord
    };
  }

  async grant(
    organizationId: string,
    userId: string,
    request: ConsentRequest
  ): Promise<ConsentRecord> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (!request.permissions || request.permissions.length === 0) {
        throw new Error('At least one permission required');
      }

      const record = await this.operations.insertConsent(
        this.supabase,
        organizationId,
        userId,
        request,
        this.consentVersion
      );

      console.log('[ConsentManager] Consent granted:', {
        organizationId,
        userId,
        service: request.service,
        operation: request.operation
      });

      return record;
    } catch (error) {
      console.error('[ConsentManager] Grant error:', error);
      throw error;
    }
  }

  async verify(
    organizationId: string,
    service: string,
    operation: string
  ): Promise<ConsentVerification> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      const data = await this.operations.selectConsent(this.supabase, organizationId, service, operation);

      if (!data) {
        return {
          hasConsent: false,
          reason: 'No consent granted for this operation'
        };
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return {
          hasConsent: false,
          reason: 'Consent has expired'
        };
      }

      return {
        hasConsent: true,
        consentRecord: this.operations.mapToConsentRecord(data)
      };
    } catch (error) {
      console.error('[ConsentManager] Verify error:', error);
      throw error;
    }
  }

  async revoke(
    organizationId: string,
    service: string,
    operation: string
  ): Promise<void> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      await this.operations.updateConsentRevoked(this.supabase, organizationId, service, operation);

      console.log('[ConsentManager] Consent revoked:', {
        organizationId,
        service,
        operation
      });
    } catch (error) {
      console.error('[ConsentManager] Revoke error:', error);
      throw error;
    }
  }

  async revokeById(organizationId: string, consentId: string): Promise<void> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      await this.operations.updateConsentRevokedById(this.supabase, organizationId, consentId);

      console.log('[ConsentManager] Consent revoked by ID:', {
        organizationId,
        consentId
      });
    } catch (error) {
      console.error('[ConsentManager] RevokeById error:', error);
      throw error;
    }
  }

  async list(
    organizationId: string,
    options?: {
      activeOnly?: boolean;
      service?: string;
    }
  ): Promise<ConsentRecord[]> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      let query = this.supabase
        .from('autonomous_consent')
        .select('*')
        .eq('organization_id', organizationId)
        .order('granted_at', { ascending: false });

      if (options?.activeOnly) {
        query = query.eq('is_active', true);
      }

      if (options?.service) {
        query = query.eq('service', options.service);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list consents: ${error.message}`);
      }

      return (data || []).map((d: any) => this.operations.mapToConsentRecord(d));
    } catch (error) {
      console.error('[ConsentManager] List error:', error);
      throw error;
    }
  }

  async getById(consentId: string): Promise<ConsentRecord | null> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await this.supabase
        .from('autonomous_consent')
        .select('*')
        .eq('id', consentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to get consent: ${error.message}`);
      }

      return this.operations.mapToConsentRecord(data);
    } catch (error) {
      console.error('[ConsentManager] GetById error:', error);
      throw error;
    }
  }

  async hasPermission(
    organizationId: string,
    service: string,
    operation: string,
    permission: string
  ): Promise<boolean> {
    const verification = await this.verify(organizationId, service, operation);

    if (!verification.hasConsent || !verification.consentRecord) {
      return false;
    }

    return verification.consentRecord.permissions.includes(permission);
  }

  async extend(
    organizationId: string,
    service: string,
    operation: string,
    newExpiresAt: Date
  ): Promise<void> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      await this.operations.updateConsentExpiry(this.supabase, organizationId, service, operation, newExpiresAt);

      console.log('[ConsentManager] Consent extended:', {
        organizationId,
        service,
        operation,
        newExpiresAt
      });
    } catch (error) {
      console.error('[ConsentManager] Extend error:', error);
      throw error;
    }
  }

  async getStats(organizationId: string): Promise<{
    total: number;
    active: number;
    revoked: number;
    expired: number;
  }> {
    try {
      const all = await this.list(organizationId);

      return {
        total: all.length,
        active: all.filter(c => c.isActive).length,
        revoked: all.filter(c => c.revokedAt !== null).length,
        expired: all.filter(c =>
          c.expiresAt && new Date(c.expiresAt) < new Date() && !c.revokedAt
        ).length
      };
    } catch (error) {
      console.error('[ConsentManager] GetStats error:', error);
      throw error;
    }
  }

  async revokeAllForService(organizationId: string, service: string): Promise<number> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      const count = await this.operations.bulkRevokeForService(this.supabase, organizationId, service);
      console.log(`[ConsentManager] Revoked ${count} consents for service ${service}`);
      return count;
    } catch (error) {
      console.error('[ConsentManager] RevokeAllForService error:', error);
      throw error;
    }
  }
}

let consentManagerInstance: ConsentManager | null = null;

/**
 * Get or create ConsentManager singleton
 * @param client Optional Supabase client (for testing)
 */
export function getConsentManager(client?: SupabaseClient | null): ConsentManager {
  if (!consentManagerInstance) {
    consentManagerInstance = new ConsentManager(client);
  }
  return consentManagerInstance;
}
