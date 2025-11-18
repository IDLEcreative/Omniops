/**
 * Conversation Widget Configuration
 *
 * Handles loading and managing widget configurations from database
 * with two-tier caching (Redis + Database)
 */

import { TwoTierCache } from '@/lib/cache/two-tier-cache';
import { CACHE_TTL } from '@/lib/cache/cache-config';

// Cache instances
const widgetConfigCache = new TwoTierCache<WidgetConfig>({
  ttl: CACHE_TTL.WIDGET_CONFIG,
  prefix: 'widget-config',
});

const customerProfileCache = new TwoTierCache<CustomerProfile>({
  ttl: CACHE_TTL.CUSTOMER_PROFILE,
  prefix: 'customer-profile',
});

/**
 * Widget Configuration Interface
 * Represents the complete widget configuration from database
 */
export interface WidgetConfig {
  theme_settings?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    darkMode?: boolean;
    customCSS?: string;
  };
  position_settings?: {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    offsetX?: number;
    offsetY?: number;
  };
  ai_settings?: {
    personality?: 'professional' | 'friendly' | 'helpful' | 'concise' | 'technical';
    responseLength?: 'short' | 'balanced' | 'detailed';
    language?: string;
    customSystemPrompt?: string;
    enableSmartSuggestions?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
  behavior_settings?: {
    botName?: string;
    welcomeMessage?: string;
    placeholderText?: string;
    showAvatar?: boolean;
    autoOpen?: boolean;
    openDelay?: number;
    soundNotifications?: boolean;
  };
  integration_settings?: {
    enableWooCommerce?: boolean;
    enableWebSearch?: boolean;
    enableKnowledgeBase?: boolean;
    dataSourcePriority?: string[];
  };
  analytics_settings?: {
    trackConversations?: boolean;
    dataRetentionDays?: number;
  };
  branding_settings?: {
    customLogoUrl?: string;
    showPoweredBy?: boolean;
  };
}

export interface CustomerProfile {
  domain?: string | null;
  domainLabel?: string | null;
  domainDescription?: string | null;
  businessName?: string | null;
  businessDescription?: string | null;
}

/**
 * Load widget configuration from database with two-tier caching
 * Returns null if no configuration found
 *
 * Cache: L1 (Redis 5min) → L2 (Database)
 */
export async function loadWidgetConfig(
  domainId: string | null,
  supabase: any
): Promise<WidgetConfig | null> {
  if (!domainId) {
    return null;
  }

  try {
    return await widgetConfigCache.get(
      domainId,
      async () => {
        // Get the customer_config_id from the domain
        const { data: domainData, error: domainError } = await supabase
          .from('domains')
          .select('customer_config_id')
          .eq('id', domainId)
          .single();

        if (domainError || !domainData?.customer_config_id) {
          console.log('[ConversationManager] No customer_config_id found for domain');
          return null;
        }

        // Get the active widget configuration
        const { data: widgetConfig, error: configError } = await supabase
          .from('widget_configs')
          .select('config_data')
          .eq('customer_config_id', domainData.customer_config_id)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (configError || !widgetConfig) {
          console.log('[ConversationManager] No active widget config found');
          return null;
        }

        return widgetConfig.config_data as WidgetConfig;
      }
    );
  } catch (error) {
    console.error('[ConversationManager] Error loading widget config:', error);
    return null;
  }
}

/**
 * Update widget configuration and invalidate cache
 * Call this after updating widget config to ensure cache consistency
 */
export async function invalidateWidgetConfig(domainId: string): Promise<void> {
  await widgetConfigCache.invalidate(domainId);
}

/**
 * Load basic customer profile/branding metadata for the domain with caching
 *
 * Cache: L1 (Redis 10min) → L2 (Database)
 */
export async function loadCustomerProfile(
  domainId: string | null,
  supabase: any
): Promise<CustomerProfile | null> {
  if (!domainId) {
    return null;
  }

  try {
    return await customerProfileCache.get(
      domainId,
      async () => {
        const { data: domainData, error: domainError } = await supabase
          .from('domains')
          .select('domain, name, description, customer_config_id')
          .eq('id', domainId)
          .single();

        if (domainError || !domainData) {
          console.log('[ConversationManager] No domain metadata found for profile context');
          return null;
        }

        const profile: CustomerProfile = {
          domain: domainData.domain || null,
          domainLabel: domainData.name || null,
          domainDescription: domainData.description || null,
          businessName: null,
          businessDescription: null
        };

        if (domainData.customer_config_id) {
          const { data: customerConfig, error: customerError } = await supabase
            .from('customer_configs')
            .select('business_name, business_description')
            .eq('id', domainData.customer_config_id)
            .single();

          if (!customerError && customerConfig) {
            profile.businessName = customerConfig.business_name;
            profile.businessDescription = customerConfig.business_description;
          }
        }

        return profile;
      }
    );
  } catch (error) {
    console.error('[ConversationManager] Error loading customer profile:', error);
    return null;
  }
}

/**
 * Invalidate customer profile cache
 * Call this after updating customer or domain data
 */
export async function invalidateCustomerProfile(domainId: string): Promise<void> {
  await customerProfileCache.invalidate(domainId);
}
