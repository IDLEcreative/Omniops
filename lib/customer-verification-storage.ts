/**
 * Customer Verification Storage Operations
 *
 * Database operations for caching and logging customer verification data.
 * Part of the customer verification module refactoring.
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { DataType, VERIFICATION_CONFIG } from './customer-verification-types';

/**
 * Storage operations for customer verification system
 */
export class VerificationStorage {
  /**
   * Log customer data access for audit
   */
  static async logAccess(
    conversationId: string,
    customerEmail: string,
    wooCustomerId: number | null,
    accessedData: string[],
    reason: string,
    verifiedVia: string
  ): Promise<void> {
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      console.error('Database connection unavailable for logging access');
      return;
    }

    try {
      await supabase.rpc('log_customer_access', {
        p_conversation_id: conversationId,
        p_customer_email: customerEmail,
        p_woo_customer_id: wooCustomerId,
        p_accessed_data: accessedData,
        p_reason: reason,
        p_verified_via: verifiedVia
      });
    } catch (error) {
      console.error('Error logging access:', error);
    }
  }

  /**
   * Cache customer data for quick retrieval
   */
  static async cacheCustomerData(
    conversationId: string,
    customerEmail: string,
    wooCustomerId: number,
    data: any,
    dataType: DataType
  ): Promise<void> {
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      console.error('Database connection unavailable for caching data');
      return;
    }

    try {
      await supabase
        .from('customer_data_cache')
        .upsert({
          conversation_id: conversationId,
          customer_email: customerEmail,
          woo_customer_id: wooCustomerId,
          cached_data: data,
          data_type: dataType,
          expires_at: new Date(Date.now() + VERIFICATION_CONFIG.EXPIRY_MINUTES * 60 * 1000).toISOString()
        });
    } catch (error) {
      console.error('Error caching customer data:', error);
    }
  }

  /**
   * Get cached customer data
   */
  static async getCachedData(
    conversationId: string,
    dataType?: string
  ): Promise<any | null> {
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return null;
    }

    try {
      let query = supabase
        .from('customer_data_cache')
        .select('cached_data, data_type')
        .eq('conversation_id', conversationId)
        .gte('expires_at', new Date().toISOString());

      if (dataType) {
        query = query.eq('data_type', dataType);
      }

      const { data } = await query.order('created_at', { ascending: false }).limit(1);

      if (data && data.length > 0) {
        const firstItem = data[0];
        if (firstItem) {
          return firstItem.cached_data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Clean expired verification data
   */
  static async cleanExpiredData(): Promise<void> {
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      console.error('Database connection unavailable for cleaning expired data');
      return;
    }

    try {
      await supabase.rpc('clean_expired_customer_data');
    } catch (error) {
      console.error('Error cleaning expired data:', error);
    }
  }
}
