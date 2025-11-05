import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Commerce Provider Interface
 * Defines operations that any e-commerce platform (WooCommerce, Shopify, etc.) must implement
 */

export interface OrderInfo {
  id: string | number;
  number: string | number;
  status: string;
  date: string;
  total: string | number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    total?: string;
  }>;
  billing?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  shipping?: any;
  trackingNumber?: string | null;
  permalink?: string | null;
}

export interface CommerceProvider {
  readonly platform: string;
  lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null>;
  searchProducts(query: string, limit?: number): Promise<any[]>;
  checkStock(productId: string): Promise<any>;
  getProductDetails(productId: string): Promise<any>;
}

type CustomerConfig = {
  woocommerce_enabled?: boolean | null;
  woocommerce_url?: string | null;
  shopify_enabled?: boolean | null;
  shopify_shop?: string | null;
};

type ProviderDetectorContext = {
  domain: string;
  config: CustomerConfig | null;
};

type ProviderDetector = (ctx: ProviderDetectorContext) => Promise<CommerceProvider | null>;

const providerCache = new Map<string, { provider: CommerceProvider | null; expiresAt: number }>();
const PROVIDER_CACHE_TTL_MS = 60_000;

function normalizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .trim()
    .toLowerCase();
}

async function loadCustomerConfig(domain: string): Promise<CustomerConfig | null> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('customer_configs')
      .select('woocommerce_url, shopify_shop')
      .eq('domain', domain)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[Commerce Provider] Failed to load configuration:', error);
      }
      return null;
    }

    return data as CustomerConfig;
  } catch (error) {
    console.error('[Commerce Provider] Error loading configuration:', error);
    return null;
  }
}

function hasWooCommerceSupport(config: CustomerConfig | null): boolean {
  // Check if database has WooCommerce configuration (presence of URL indicates it's configured)
  if (config?.woocommerce_url) {
    return true;
  }

  // Fallback to environment variables for backward compatibility
  return Boolean(
    process.env.WOOCOMMERCE_URL &&
      process.env.WOOCOMMERCE_CONSUMER_KEY &&
      process.env.WOOCOMMERCE_CONSUMER_SECRET
  );
}

function hasShopifySupport(config: CustomerConfig | null): boolean {
  // Check if database has Shopify configuration (presence of shop indicates it's configured)
  if (config?.shopify_shop) {
    return true;
  }

  // Fallback to environment variables for backward compatibility
  return Boolean(process.env.SHOPIFY_SHOP && process.env.SHOPIFY_ACCESS_TOKEN);
}

const detectShopify: ProviderDetector = async ({ domain, config }) => {
  if (!hasShopifySupport(config)) {
    return null;
  }

  try {
    const { getDynamicShopifyClient } = await import('@/lib/shopify-dynamic');
    const client = await getDynamicShopifyClient(domain);

    if (!client) {
      return null;
    }

    const { ShopifyProvider } = await import('./providers/shopify-provider');
    return new ShopifyProvider(client);
  } catch (error) {
    console.error('[Commerce Provider] Failed to initialize Shopify provider:', error);
    return null;
  }
};

const detectWooCommerce: ProviderDetector = async ({ domain, config }) => {
  if (!hasWooCommerceSupport(config)) {
    return null;
  }

  try {
    const { getDynamicWooCommerceClient } = await import('@/lib/woocommerce-dynamic');
    const client = await getDynamicWooCommerceClient(domain);

    if (!client) {
      return null;
    }

    const { WooCommerceProvider } = await import('./providers/woocommerce-provider');
    return new WooCommerceProvider(client);
  } catch (error) {
    console.error('[Commerce Provider] Failed to initialize WooCommerce provider:', error);
    return null;
  }
};

const providerDetectors: ProviderDetector[] = [detectShopify, detectWooCommerce];

/**
 * Resolves a commerce provider for a domain with comprehensive diagnostics
 * @returns Provider instance or null if none found
 */
async function resolveProvider(domain: string): Promise<CommerceProvider | null> {
  const startTime = Date.now();
  console.log('[Provider] Resolution started', {
    domain,
    timestamp: startTime,
    cacheHit: false,
  });

  const config = await loadCustomerConfig(domain);

  for (const detector of providerDetectors) {
    const detectorName = detector === detectShopify ? 'shopify' : 'woocommerce';
    console.log(`[Provider] Trying detector: ${detectorName}`, { domain });

    try {
      const provider = await detector({ domain, config });
      if (provider) {
        const duration = Date.now() - startTime;
        console.log('[Provider] Resolution completed', {
          domain,
          hasProvider: true,
          platform: provider.platform,
          duration,
          totalAttempts: 1,
        });
        return provider;
      }
      console.log(`[Provider] Detector returned null: ${detectorName}`, { domain });
    } catch (error) {
      console.error(`[Provider] Detector failed: ${detectorName}`, {
        domain,
        error: error instanceof Error ? error.message : 'unknown error',
        willRetry: false,
      });
    }
  }

  const duration = Date.now() - startTime;
  console.log('[Provider] Resolution completed', {
    domain,
    hasProvider: false,
    platform: null,
    duration,
    totalAttempts: 1,
  });
  return null;
}

/**
 * Resolves a commerce provider with exponential backoff retry logic
 * Retries up to 2 times with delays: 100ms, 200ms
 * @returns Provider instance or null if all attempts fail
 */
async function resolveProviderWithRetry(
  domain: string,
  maxRetries = 2
): Promise<CommerceProvider | null> {
  const startTime = Date.now();
  const delays = [100, 200]; // Exponential backoff delays in ms

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log('[Provider] Resolution attempt', {
        domain,
        attempt,
        maxAttempts: maxRetries + 1,
        timestamp: Date.now(),
      });

      const config = await loadCustomerConfig(domain);

      for (const detector of providerDetectors) {
        const detectorName = detector === detectShopify ? 'shopify' : 'woocommerce';
        console.log(`[Provider] Trying detector: ${detectorName}`, { domain, attempt });

        try {
          const provider = await detector({ domain, config });
          if (provider) {
            const duration = Date.now() - startTime;
            console.log('[Provider] Resolution completed', {
              domain,
              hasProvider: true,
              platform: provider.platform,
              duration,
              totalAttempts: attempt,
            });
            return provider;
          }
          console.log(`[Provider] Detector returned null: ${detectorName}`, {
            domain,
            attempt,
          });
        } catch (error) {
          const willRetry = attempt < maxRetries + 1;
          console.error(`[Provider] Detector failed: ${detectorName}`, {
            domain,
            error: error instanceof Error ? error.message : 'unknown error',
            attempt,
            willRetry,
          });

          // If this detector failed but we have more retries, continue to next detector
          // The outer retry loop will retry all detectors
        }
      }

      // No provider found in this attempt
      if (attempt < maxRetries + 1) {
        const backoffMs = delays[attempt - 1] || 200;
        console.log(`[Provider] Retry attempt ${attempt + 1}/${maxRetries + 1}`, {
          domain,
          backoffMs,
          timestamp: Date.now(),
        });
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    } catch (error) {
      const willRetry = attempt < maxRetries + 1;
      console.error('[Provider] Resolution attempt failed', {
        domain,
        attempt,
        error: error instanceof Error ? error.message : 'unknown error',
        willRetry,
      });

      if (attempt < maxRetries + 1) {
        const backoffMs = delays[attempt - 1] || 200;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  const duration = Date.now() - startTime;
  console.log('[Provider] Resolution completed', {
    domain,
    hasProvider: false,
    platform: null,
    duration,
    totalAttempts: maxRetries + 1,
  });
  return null;
}

export async function getCommerceProvider(domain: string): Promise<CommerceProvider | null> {
  const normalizedDomain = normalizeDomain(domain || '');

  if (!normalizedDomain || /localhost|127\.0\.0\.1/.test(normalizedDomain)) {
    console.log('[Provider] Skipping provider resolution', {
      domain: normalizedDomain,
      reason: 'localhost or invalid domain',
    });
    return null;
  }

  const cached = providerCache.get(normalizedDomain);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    console.log('[Provider] Cache hit', {
      domain: normalizedDomain,
      platform: cached.provider?.platform || null,
      expiresIn: cached.expiresAt - now,
    });
    return cached.provider;
  }

  if (cached) {
    console.log('[Provider] Cache expired', {
      domain: normalizedDomain,
      expiredAgo: now - cached.expiresAt,
    });
  } else {
    console.log('[Provider] Cache miss', {
      domain: normalizedDomain,
    });
  }

  // Use retry logic to resolve provider
  const provider = await resolveProviderWithRetry(normalizedDomain);

  providerCache.set(normalizedDomain, {
    provider,
    expiresAt: now + PROVIDER_CACHE_TTL_MS,
  });

  console.log('[Provider] Cache updated', {
    domain: normalizedDomain,
    hasProvider: !!provider,
    platform: provider?.platform || null,
    ttlMs: PROVIDER_CACHE_TTL_MS,
  });

  return provider;
}

export function clearCommerceProviderCache() {
  providerCache.clear();
}
