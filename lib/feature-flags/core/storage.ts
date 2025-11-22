/**
 * Feature Flag Storage Layer
 *
 * Purpose: Database operations for feature flag overrides
 * Last Updated: 2025-11-08
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';
import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';

/**
 * Fetch customer-specific feature flag overrides from database
 * @deprecated Use getOrganizationOverride instead - customer_id is legacy
 */
export async function getCustomerOverride(
  customerId: string
): Promise<Partial<ChatWidgetFeatureFlags> | null> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('customer_feature_flags')
      .select('flags')
      .eq('organization_id', customerId) // Support legacy parameter name but query organization_id
      .single();

    if (error || !data) {
      return null;
    }

    return data.flags as Partial<ChatWidgetFeatureFlags>;
  } catch (error) {
    console.error('Error fetching customer feature flags:', error);
    return null;
  }
}

/**
 * Fetch organization-wide feature flag overrides from database
 */
export async function getOrganizationOverride(
  organizationId: string
): Promise<Partial<ChatWidgetFeatureFlags> | null> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('organization_feature_flags')
      .select('flags')
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.flags as Partial<ChatWidgetFeatureFlags>;
  } catch (error) {
    console.error('Error fetching organization feature flags:', error);
    return null;
  }
}

/**
 * Save customer-specific feature flags to database
 * @deprecated Use saveOrganizationFlags instead - customer_id is legacy
 */
export async function saveCustomerFlags(
  customerId: string,
  flags: Partial<ChatWidgetFeatureFlags>,
  changedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    const { error } = await supabase
      .from('customer_feature_flags')
      .upsert({
        organization_id: customerId, // Support legacy parameter name but use organization_id
        flags,
        updated_at: new Date().toISOString(),
        updated_by: changedBy,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving customer feature flags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save organization-wide feature flags to database
 */
export async function saveOrganizationFlags(
  organizationId: string,
  flags: Partial<ChatWidgetFeatureFlags>,
  changedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    const { error } = await supabase
      .from('organization_feature_flags')
      .upsert({
        organization_id: organizationId,
        flags,
        updated_at: new Date().toISOString(),
        updated_by: changedBy,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving organization feature flags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
