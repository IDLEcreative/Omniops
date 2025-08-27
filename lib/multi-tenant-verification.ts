import { createServiceRoleClient } from '@/lib/supabase/server';
import { WooCommerceAPI } from '@/lib/woocommerce-api';

/**
 * Multi-Tenant Customer Verification
 * Each business has isolated customer data
 */
export class MultiTenantCustomerVerification {
  
  /**
   * Get business ID from domain or session
   */
  static async getBusinessId(domain?: string, apiKey?: string): Promise<string | null> {
    const supabase = await createServiceRoleClient();
    
    // Method 1: From domain (embedded widget)
    if (domain) {
      const { data } = await supabase
        .from('business_configs')
        .select('business_id')
        .eq('domain', domain)
        .single();
      
      return data?.business_id || null;
    }
    
    // Method 2: From API key (direct API calls)
    if (apiKey) {
      // Validate API key and get business
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('api_key', apiKey)
        .single();
      
      return data?.id || null;
    }
    
    return null;
  }

  /**
   * Verify customer - scoped to specific business
   */
  static async verifyCustomer(
    businessId: string,
    conversationId: string,
    customerInfo: {
      email?: string;
      name?: string;
      orderNumber?: string;
      postalCode?: string;
    }
  ) {
    const supabase = await createServiceRoleClient();
    
    // All queries are scoped to this business
    const { data: config } = await supabase
      .from('business_configs')
      .select('*')
      .eq('business_id', businessId)
      .single();
    
    if (!config) {
      throw new Error('Business configuration not found');
    }
    
    // Check if this business has WooCommerce enabled
    if (config.woocommerce_enabled) {
      // Use THEIR WooCommerce credentials
      const wcClient = new WooCommerceAPI({
        url: config.woocommerce_url,
        consumerKey: decrypt(config.woocommerce_consumer_key_encrypted),
        consumerSecret: decrypt(config.woocommerce_consumer_secret_encrypted),
      });
      
      // Verify against THEIR customer database
      if (customerInfo.email) {
        const customer = await wcClient.getCustomerByEmail(customerInfo.email);
        if (customer) {
          // Log access for THIS business
          await this.logAccess(businessId, conversationId, customerInfo.email, ['customer_lookup']);
          return { verified: true, level: 'full', customer };
        }
      }
    }
    
    // Check if this business has Shopify enabled
    if (config.shopify_enabled) {
      // Use THEIR Shopify credentials
      // ... similar logic
    }
    
    return { verified: false, level: 'none' };
  }

  /**
   * Log customer data access - scoped to business
   */
  static async logAccess(
    businessId: string,
    conversationId: string,
    customerEmail: string,
    dataAccessed: string[]
  ) {
    const supabase = await createServiceRoleClient();
    
    await supabase
      .from('customer_access_logs')
      .insert({
        business_id: businessId, // Critical: scope to business
        conversation_id: conversationId,
        customer_email: customerEmail,
        data_accessed: dataAccessed,
        access_reason: 'Customer service inquiry',
        access_method: 'chat_verification',
      });
    
    // Track usage for billing
    await this.trackUsage(businessId, 'verification');
  }

  /**
   * Track API usage for billing
   */
  static async trackUsage(businessId: string, usageType: string) {
    const supabase = await createServiceRoleClient();
    
    // Increment daily usage
    await supabase.rpc('track_api_usage', {
      p_business_id: businessId,
      p_usage_type: usageType
    });
    
    // Check if over limit
    const { data: business } = await supabase
      .from('businesses')
      .select('api_calls_this_month, api_calls_limit')
      .eq('id', businessId)
      .single();
    
    if (business && business.api_calls_this_month >= business.api_calls_limit) {
      throw new Error('API usage limit exceeded. Please upgrade your plan.');
    }
  }

  /**
   * Get cached data - scoped to business
   */
  static async getCachedData(
    businessId: string,
    conversationId: string,
    cacheKey: string
  ) {
    const supabase = await createServiceRoleClient();
    
    const { data } = await supabase
      .from('customer_data_cache')
      .select('cached_data')
      .eq('business_id', businessId) // Critical: scope to business
      .eq('conversation_id', conversationId)
      .eq('cache_key', cacheKey)
      .gte('expires_at', new Date().toISOString())
      .single();
    
    return data?.cached_data || null;
  }

  /**
   * Store cached data - scoped to business
   */
  static async cacheData(
    businessId: string,
    conversationId: string,
    cacheKey: string,
    data: any
  ) {
    const supabase = await createServiceRoleClient();
    
    await supabase
      .from('customer_data_cache')
      .upsert({
        business_id: businessId, // Critical: scope to business
        conversation_id: conversationId,
        cache_key: cacheKey,
        cached_data: data,
        data_type: 'customer_data',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
  }
}

/**
 * Helper to decrypt encrypted credentials
 */
function decrypt(encrypted: string): string {
  // Implement your decryption logic
  // This is a placeholder - use proper encryption in production
  return encrypted;
}