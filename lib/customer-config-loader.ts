import { createClient } from '@/lib/supabase-server';
import { OwnSiteDetector } from './own-site-detector';
import { decrypt } from './encryption';

export class CustomerConfigLoader {
  /**
   * Get full customer configuration including WooCommerce credentials
   */
  static async getConfig(domain: string) {
    try {
      const supabase = await createClient();
      if (!supabase) {
        throw new Error('Database connection unavailable');
      }

      // Try to get config by domain
      const { data, error } = await supabase
        .from('customer_configs')
        .select('*')
        .or(`owned_domains.cs.{${domain}}`)
        .single();

      if (error || !data) {
        // If no config found by domain, try to get by authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (!authError && user) {
          const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();
            
          if (customer) {
            const { data: configData } = await supabase
              .from('customer_configs')
              .select('*')
              .eq('customer_id', customer.id)
              .single();
              
            if (configData) {
              // Decrypt WooCommerce credentials if they exist
              if (configData.woocommerce_consumer_key) {
                configData.woocommerce_consumer_key = decrypt(configData.woocommerce_consumer_key);
              }
              if (configData.woocommerce_consumer_secret) {
                configData.woocommerce_consumer_secret = decrypt(configData.woocommerce_consumer_secret);
              }
              
              return configData;
            }
          }
        }
        
        return null;
      }

      // Decrypt WooCommerce credentials if they exist
      if (data.woocommerce_consumer_key) {
        data.woocommerce_consumer_key = decrypt(data.woocommerce_consumer_key);
      }
      if (data.woocommerce_consumer_secret) {
        data.woocommerce_consumer_secret = decrypt(data.woocommerce_consumer_secret);
      }

      return data;
    } catch (error) {
      console.error('Failed to load customer config:', error);
      return null;
    }
  }

  static async loadOwnedDomains(customerId?: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      // If customerId provided, load for specific customer
      if (customerId) {
        if (!supabase) {
          throw new Error('Database connection unavailable');
        }
        const { data, error } = await supabase
          .from('customer_configs')
          .select('owned_domains')
          .eq('customer_id', customerId)
          .single();
          
        if (!error && data?.owned_domains) {
          data.owned_domains.forEach((domain: string) => {
            OwnSiteDetector.addOwnedDomain(domain);
          });
          console.log(`Loaded ${data.owned_domains.length} owned domains for customer`);
        }
        return;
      }
      
      // Otherwise, try to load for authenticated user
      if (!supabase) {
        return;
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!authError && user) {
        // Get customer data
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
          
        if (!customerError && customer) {
          if (!supabase) {
            return;
          }
          const { data, error } = await supabase
            .from('customer_configs')
            .select('owned_domains')
            .eq('customer_id', customer.id)
            .single();
            
          if (!error && data?.owned_domains) {
            data.owned_domains.forEach((domain: string) => {
              OwnSiteDetector.addOwnedDomain(domain);
            });
            console.log(`Loaded ${data.owned_domains.length} owned domains for authenticated user`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load owned domains from database:', error);
    }
  }
  
  // Load owned domains when initializing scraper
  static async initializeForScraping(customerId?: string): Promise<void> {
    // First load from environment
    OwnSiteDetector.loadFromEnvironment();
    
    // Then load from database
    await this.loadOwnedDomains(customerId);
  }
}

// Export singleton instance for backward compatibility
export const customerConfigLoader = CustomerConfigLoader;