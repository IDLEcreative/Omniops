/**
 * Widget Configuration Loader
 *
 * Handles database queries to fetch customer and widget configurations.
 */

// eslint-disable-next-line no-restricted-imports -- Type-only import, no runtime code imported
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CustomerConfig {
  id: string;
  app_id: string | null;
  domain: string;
  business_name: string | null;
  primary_color: string | null;
  welcome_message: string | null;
  suggested_questions: string[] | null;
  woocommerce_url: string | null;
  shopify_shop: string | null;
  active: boolean;
}

export interface WidgetConfig {
  theme_settings: Record<string, any> | null;
  position_settings: Record<string, any> | null;
  behavior_settings: Record<string, any> | null;
  branding_settings: Record<string, any> | null;
}

export interface ConfigLoadResult {
  customerConfig: CustomerConfig | null;
  widgetConfig: WidgetConfig | null;
  customerConfigId: string | null;
}

/**
 * Load configuration by app_id
 */
export async function loadConfigByAppId(
  supabase: SupabaseClient,
  appId: string
): Promise<CustomerConfig | null> {
  const { data, error } = await supabase
    .from('customer_configs')
    .select(`
      id,
      app_id,
      domain,
      business_name,
      primary_color,
      welcome_message,
      suggested_questions,
      woocommerce_url,
      shopify_shop,
      active
    `)
    .eq('app_id', appId)
    .eq('active', true)
    .single();

  if (error) {
    console.error('[Config Loader] Error loading by app_id:', error);
    return null;
  }

  return data as CustomerConfig | null;
}

/**
 * Load configuration by domain
 */
export async function loadConfigByDomain(
  supabase: SupabaseClient,
  domain: string
): Promise<{ config: CustomerConfig | null; domainData: { customer_config_id: string } | null }> {
  // First, look up domain to get customer_config_id
  const { data: domainData } = await supabase
    .from('domains')
    .select('customer_config_id')
    .eq('domain_name', domain)
    .single();

  // Fetch customer config for this domain
  const { data, error } = await supabase
    .from('customer_configs')
    .select(`
      id,
      app_id,
      domain,
      business_name,
      primary_color,
      welcome_message,
      suggested_questions,
      woocommerce_url,
      shopify_shop,
      active
    `)
    .eq('domain', domain)
    .eq('active', true)
    .single();

  if (error) {
    console.error('[Config Loader] Error loading by domain:', error);
    return { config: null, domainData: domainData as { customer_config_id: string } | null };
  }

  return {
    config: data as CustomerConfig | null,
    domainData: domainData as { customer_config_id: string } | null,
  };
}

/**
 * Load widget configuration
 */
export async function loadWidgetConfig(
  supabase: SupabaseClient,
  customerConfigId: string
): Promise<WidgetConfig | null> {
  const { data } = await supabase
    .from('widget_configs')
    .select('theme_settings, position_settings, behavior_settings, branding_settings')
    .eq('customer_config_id', customerConfigId)
    .eq('is_active', true)
    .single();

  return data as WidgetConfig | null;
}

/**
 * Load complete configuration (customer + widget)
 */
export async function loadCompleteConfig(
  supabase: SupabaseClient,
  params: { domain?: string; appId?: string }
): Promise<ConfigLoadResult> {
  let customerConfig: CustomerConfig | null = null;
  let domainData: { customer_config_id: string } | null = null;

  // Prioritize app_id lookup over domain lookup
  if (params.appId && params.appId.trim() !== '') {
    customerConfig = await loadConfigByAppId(supabase, params.appId);
  } else if (params.domain && params.domain.trim() !== '') {
    const result = await loadConfigByDomain(supabase, params.domain);
    customerConfig = result.config;
    domainData = result.domainData;
  }

  if (!customerConfig) {
    return { customerConfig: null, widgetConfig: null, customerConfigId: null };
  }

  // Load widget config
  const customerConfigId = domainData?.customer_config_id || customerConfig.id;
  const widgetConfig = await loadWidgetConfig(supabase, customerConfigId);

  return { customerConfig, widgetConfig, customerConfigId };
}
