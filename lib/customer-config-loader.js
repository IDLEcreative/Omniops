"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerConfigLoader = exports.CustomerConfigLoader = void 0;
const supabase_server_1 = require("@/lib/supabase-server");
const own_site_detector_1 = require("./own-site-detector");
const encryption_1 = require("./encryption");
class CustomerConfigLoader {
    /**
     * Get full customer configuration including WooCommerce credentials
     */
    static async getConfig(domain) {
        try {
            const supabase = await (0, supabase_server_1.createClient)();
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
                                configData.woocommerce_consumer_key = (0, encryption_1.decrypt)(configData.woocommerce_consumer_key);
                            }
                            if (configData.woocommerce_consumer_secret) {
                                configData.woocommerce_consumer_secret = (0, encryption_1.decrypt)(configData.woocommerce_consumer_secret);
                            }
                            return configData;
                        }
                    }
                }
                return null;
            }
            // Decrypt WooCommerce credentials if they exist
            if (data.woocommerce_consumer_key) {
                data.woocommerce_consumer_key = (0, encryption_1.decrypt)(data.woocommerce_consumer_key);
            }
            if (data.woocommerce_consumer_secret) {
                data.woocommerce_consumer_secret = (0, encryption_1.decrypt)(data.woocommerce_consumer_secret);
            }
            return data;
        }
        catch (error) {
            console.error('Failed to load customer config:', error);
            return null;
        }
    }
    static async loadOwnedDomains(customerId) {
        try {
            const supabase = await (0, supabase_server_1.createClient)();
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
                    data.owned_domains.forEach((domain) => {
                        own_site_detector_1.OwnSiteDetector.addOwnedDomain(domain);
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
                        data.owned_domains.forEach((domain) => {
                            own_site_detector_1.OwnSiteDetector.addOwnedDomain(domain);
                        });
                        console.log(`Loaded ${data.owned_domains.length} owned domains for authenticated user`);
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to load owned domains from database:', error);
        }
    }
    // Load owned domains when initializing scraper
    static async initializeForScraping(customerId) {
        // First load from environment
        own_site_detector_1.OwnSiteDetector.loadFromEnvironment();
        // Then load from database
        await this.loadOwnedDomains(customerId);
    }
}
exports.CustomerConfigLoader = CustomerConfigLoader;
// Export singleton instance for backward compatibility
exports.customerConfigLoader = CustomerConfigLoader;
