// This file maintains backward compatibility by re-exporting from the new modular structure
export * from './woocommerce-api/index';
import { WooCommerceAPI } from './woocommerce-api/index';

// Export default instance for backward compatibility
export default WooCommerceAPI;