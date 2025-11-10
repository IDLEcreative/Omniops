/**
 * Autonomous Consent Database Operations
 * Low-level database operations for consent management
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConsentRequest, ConsentRecord } from './consent-types';

export async function insertConsent(
  supabase: SupabaseClient,
  customerId: string,
  userId: string,
  request: ConsentRequest,
  consentVersion: string
): Promise<ConsentRecord> {
  const { data, error } = await supabase
    .from('autonomous_consent')
    .insert({
      customer_id: customerId,
      user_id: userId,
      service: request.service,
      operation: request.operation,
      permissions: request.permissions,
      granted_at: new Date().toISOString(),
      expires_at: request.expiresAt?.toISOString() || null,
      ip_address: request.ipAddress || null,
      user_agent: request.userAgent || null,
      consent_version: consentVersion
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to grant consent: ${error.message}`);
  }

  return mapToConsentRecord(data);
}

export async function selectConsent(
  supabase: SupabaseClient,
  customerId: string,
  service: string,
  operation: string
): Promise<any> {
  const { data, error } = await supabase
    .from('autonomous_consent')
    .select('*')
    .eq('customer_id', customerId)
    .eq('service', service)
    .eq('operation', operation)
    .eq('is_active', true)
    .order('granted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify consent: ${error.message}`);
  }

  return data;
}

export async function updateConsentRevoked(
  supabase: SupabaseClient,
  customerId: string,
  service: string,
  operation: string
): Promise<void> {
  const { error } = await supabase
    .from('autonomous_consent')
    .update({ revoked_at: new Date().toISOString() })
    .eq('customer_id', customerId)
    .eq('service', service)
    .eq('operation', operation)
    .is('revoked_at', null);

  if (error) {
    throw new Error(`Failed to revoke consent: ${error.message}`);
  }
}

export async function updateConsentRevokedById(
  supabase: SupabaseClient,
  customerId: string,
  consentId: string
): Promise<void> {
  const { error } = await supabase
    .from('autonomous_consent')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', consentId)
    .eq('customer_id', customerId)
    .is('revoked_at', null);

  if (error) {
    throw new Error(`Failed to revoke consent: ${error.message}`);
  }
}

export async function updateConsentExpiry(
  supabase: SupabaseClient,
  customerId: string,
  service: string,
  operation: string,
  newExpiresAt: Date
): Promise<void> {
  const { error } = await supabase
    .from('autonomous_consent')
    .update({ expires_at: newExpiresAt.toISOString() })
    .eq('customer_id', customerId)
    .eq('service', service)
    .eq('operation', operation)
    .is('revoked_at', null);

  if (error) {
    throw new Error(`Failed to extend consent: ${error.message}`);
  }
}

export async function bulkRevokeForService(
  supabase: SupabaseClient,
  customerId: string,
  service: string
): Promise<number> {
  const { data, error } = await supabase
    .from('autonomous_consent')
    .update({ revoked_at: new Date().toISOString() })
    .eq('customer_id', customerId)
    .eq('service', service)
    .is('revoked_at', null)
    .select('id');

  if (error) {
    throw new Error(`Failed to revoke consents: ${error.message}`);
  }

  return data?.length || 0;
}

export function mapToConsentRecord(data: any): ConsentRecord {
  return {
    id: data.id,
    customerId: data.customer_id,
    userId: data.user_id,
    service: data.service,
    operation: data.operation,
    permissions: data.permissions,
    grantedAt: data.granted_at,
    expiresAt: data.expires_at,
    revokedAt: data.revoked_at,
    isActive: data.is_active,
    ipAddress: data.ip_address,
    userAgent: data.user_agent,
    consentVersion: data.consent_version,
    createdAt: data.created_at
  };
}
