import { useState, useEffect } from 'react';

export interface UseWidgetConfigProps {
  demoConfig?: any;
}

export interface WidgetConfigState {
  woocommerceEnabled: boolean;
  storeDomain: string | null;
  setWoocommerceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setStoreDomain: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Manages widget configuration including WooCommerce and domain settings
 * Handles configuration loading from API
 */
export function useWidgetConfig({ demoConfig }: UseWidgetConfigProps): WidgetConfigState {
  const [woocommerceEnabled, setWoocommerceEnabled] = useState(false);
  const [storeDomain, setStoreDomain] = useState<string | null>(null);

  useEffect(() => {
    const checkWooCommerceConfig = async () => {
      // CRITICAL FIX: If config already has domain from parent (embed.js), use it directly
      // This prevents overwriting correct domain with empty string from API
      if (demoConfig?.domain && demoConfig.domain.trim() !== '') {
        console.log('[useWidgetConfig] Using domain from demoConfig:', demoConfig.domain);
        setStoreDomain(demoConfig.domain);
        setWoocommerceEnabled(demoConfig.features?.woocommerce?.enabled || false);
        return; // Don't fetch from API - use parent config
      }

      console.log('[useWidgetConfig] No domain in demoConfig, falling back to URL detection');

      const urlParams = new URLSearchParams(window.location.search);
      let domain = urlParams.get('domain') || window.location.hostname;

      const isDemoEnvironment = domain === 'localhost' || domain === '127.0.0.1';

      if (isDemoEnvironment) {
        const DEMO_DOMAIN = process.env.NEXT_PUBLIC_DEMO_DOMAIN || 'demo.example.com';
        domain = DEMO_DOMAIN;
      }

      try {
        // Use public widget config endpoint (no authentication required)
        const response = await fetch(`/api/widget/config?domain=${encodeURIComponent(domain)}`);
        if (response && response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setWoocommerceEnabled(data.config.woocommerce_enabled || false);
            // Only set storeDomain if API returns non-empty domain
            const apiDomain =
              data.config.domain && data.config.domain.trim() !== '' ? data.config.domain : domain;
            setStoreDomain(apiDomain);
          }
        }
      } catch (error) {
        console.log('[useWidgetConfig] Could not load widget config:', error);
      }
    };

    checkWooCommerceConfig();
  }, [demoConfig]);

  return {
    woocommerceEnabled,
    storeDomain,
    setWoocommerceEnabled,
    setStoreDomain,
  };
}
