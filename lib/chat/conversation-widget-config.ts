/**
 * Conversation Widget Configuration
 *
 * Handles loading and managing widget configurations from database
 */

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
 * Load widget configuration from database
 * Returns null if no configuration found
 */
export async function loadWidgetConfig(
  domainId: string | null,
  supabase: any
): Promise<WidgetConfig | null> {
  if (!domainId) {
    return null;
  }

  try {
    // Get the customer_config_id from the domain
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('customer_config_id')
      .eq('id', domainId)
      .single();

    if (domainError || !domainData?.customer_config_id) {
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
      return null;
    }

    return widgetConfig.config_data as WidgetConfig;
  } catch (error) {
    console.error('[ConversationManager] Error loading widget config:', error);
    return null;
  }
}

/**
 * Load basic customer profile/branding metadata for the domain
 */
export async function loadCustomerProfile(
  domainId: string | null,
  supabase: any
): Promise<CustomerProfile | null> {
  if (!domainId) {
    return null;
  }

  try {
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('domain, name, description, customer_config_id')
      .eq('id', domainId)
      .single();

    if (domainError || !domainData) {
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
  } catch (error) {
    console.error('[ConversationManager] Error loading customer profile:', error);
    return null;
  }
}
