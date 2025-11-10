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
  } catch (error) {
    console.error('[ConversationManager] Error loading widget config:', error);
    return null;
  }
}
