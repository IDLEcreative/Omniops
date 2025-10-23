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
      .select('woocommerce_enabled, woocommerce_url, shopify_enabled, shopify_shop')
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
  if (config?.woocommerce_enabled && config.woocommerce_url) {
    return true;
  }

  return Boolean(
    process.env.WOOCOMMERCE_URL &&
      process.env.WOOCOMMERCE_CONSUMER_KEY &&
      process.env.WOOCOMMERCE_CONSUMER_SECRET
  );
}

function hasShopifySupport(config: CustomerConfig | null): boolean {
  if (config?.shopify_enabled && config.shopify_shop) {
    return true;
  }

  return Boolean(process.env.SHOPIFY_SHOP && process.env.SHOPIFY_ACCESS_TOKEN);
}

const detectShopify: ProviderDetector = async ({ domain, config }) => {
  if (!hasShopifySupport(config)) {
    return null;
  }

  try {
    const { ShopifyProvider } = await import('./providers/shopify-provider');
    return new ShopifyProvider(domain);
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
    const { WooCommerceProvider } = await import('./providers/woocommerce-provider');
    return new WooCommerceProvider(domain);
  } catch (error) {
    console.error('[Commerce Provider] Failed to initialize WooCommerce provider:', error);
    return null;
  }
};

const providerDetectors: ProviderDetector[] = [detectShopify, detectWooCommerce];

async function resolveProvider(domain: string): Promise<CommerceProvider | null> {
  const config = await loadCustomerConfig(domain);

  for (const detector of providerDetectors) {
    const provider = await detector({ domain, config });
    if (provider) {
      return provider;
    }
  }

  return null;
}

export async function getCommerceProvider(domain: string): Promise<CommerceProvider | null> {
  const normalizedDomain = normalizeDomain(domain || '');

  if (!normalizedDomain || /localhost|127\.0\.0\.1/.test(normalizedDomain)) {
    return null;
  }

  const cached = providerCache.get(normalizedDomain);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.provider;
  }

  const provider = await resolveProvider(normalizedDomain);

  providerCache.set(normalizedDomain, {
    provider,
    expiresAt: now + PROVIDER_CACHE_TTL_MS,
  });

  return provider;
}

export function clearCommerceProviderCache() {
  providerCache.clear();
}
