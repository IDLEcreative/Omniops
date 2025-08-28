import { createClient } from '@/lib/supabase-server';
import { OwnSiteDetector } from './own-site-detector';

export class CustomerConfigLoader {
  static async loadOwnedDomains(customerId?: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      // If customerId provided, load for specific customer
      if (customerId) {
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!authError && user) {
        // Get customer data
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
          
        if (!customerError && customer) {
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