import { createClient } from '@/lib/supabase-server';
import { OwnSiteDetector } from './own-site-detector';
import { decrypt } from './encryption';

export class CustomerConfigLoader {
  /**
   * Get full customer configuration including WooCommerce credentials
   * Now supports organization-based architecture
   */
  static async getConfig(domain: string) {
    try {
      const supabase = await createClient();
      if (!supabase) {
        throw new Error('Database connection unavailable');
      }

      // Find the domain record (organization-only)
      const { data: domainRecord, error: domainError } = await supabase
        .from('domains')
        .select('id, organization_id')
        .eq('domain', domain)
        .single();

      let configData = null;

      if (!domainError && domainRecord?.organization_id) {
        // Get config via organization_id
        const { data } = await supabase
          .from('customer_configs')
          .select('*')
          .eq('organization_id', domainRecord.organization_id)
          .single();

        configData = data;
      }

      // If no config found by domain, try authenticated user's organization
      if (!configData) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!authError && user) {
          // Get user's organization membership
          const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

          if (membership?.organization_id) {
            // Get config via organization
            const { data } = await supabase
              .from('customer_configs')
              .select('*')
              .eq('organization_id', membership.organization_id)
              .single();

            configData = data;
          }
        }
      }

      if (!configData) {
        return null;
      }

      // Decrypt WooCommerce credentials if they exist
      if (configData.woocommerce_consumer_key) {
        configData.woocommerce_consumer_key = decrypt(configData.woocommerce_consumer_key);
      }
      if (configData.woocommerce_consumer_secret) {
        configData.woocommerce_consumer_secret = decrypt(configData.woocommerce_consumer_secret);
      }

      return configData;
    } catch (error) {
      console.error('Failed to load customer config:', error);
      return null;
    }
  }

  static async loadOwnedDomains(organizationId?: string): Promise<void> {
    try {
      const supabase = await createClient();

      // If organizationId provided, load for specific organization
      if (organizationId) {
        if (!supabase) {
          throw new Error('Database connection unavailable');
        }

        // Get all domains for this organization
        const { data: domains, error } = await supabase
          .from('domains')
          .select('domain')
          .eq('organization_id', organizationId);

        if (!error && domains) {
          domains.forEach((d: { domain: string }) => {
            OwnSiteDetector.addOwnedDomain(d.domain);
          });
          console.log(`Loaded ${domains.length} owned domains for organization`);
        }
        return;
      }

      // Otherwise, try to load for authenticated user's organization
      if (!supabase) {
        return;
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!authError && user) {
        // Get user's organization
        const { data: membership, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (!membershipError && membership) {
          // Get all domains for user's organization
          const { data: domains, error } = await supabase
            .from('domains')
            .select('domain')
            .eq('organization_id', membership.organization_id);

          if (!error && domains) {
            domains.forEach((d: { domain: string }) => {
              OwnSiteDetector.addOwnedDomain(d.domain);
            });
            console.log(`Loaded ${domains.length} owned domains for authenticated user's organization`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load owned domains from database:', error);
    }
  }

  // Load owned domains when initializing scraper
  static async initializeForScraping(organizationId?: string): Promise<void> {
    // First load from environment
    OwnSiteDetector.loadFromEnvironment();

    // Then load from database
    await this.loadOwnedDomains(organizationId);
  }
}

// Export singleton instance for backward compatibility
export const customerConfigLoader = CustomerConfigLoader;
