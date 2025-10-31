/**
 * Public Widget Configuration API
 *
 * Returns public-safe configuration for the chat widget.
 * NO authentication required - this is a public endpoint.
 * NO credentials exposed - only feature flags and branding.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
});

export async function GET(request: NextRequest) {
  try {
    // Parse and validate domain parameter
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    const validatedQuery = QuerySchema.parse({ domain });

    // Create Supabase client (no auth required for this endpoint)
    const supabase = await createServiceRoleClient();

    // First, look up domain to get customer_config_id
    const { data: domainData } = await supabase
      .from('domains')
      .select('customer_config_id')
      .eq('domain_name', validatedQuery.domain)
      .single();

    // Fetch customer config for this domain
    // Only select PUBLIC-SAFE fields - NO credentials!
    const { data: config, error } = await supabase
      .from('customer_configs')
      .select(`
        id,
        domain,
        business_name,
        primary_color,
        welcome_message,
        suggested_questions,
        woocommerce_url,
        shopify_shop,
        active
      `)
      .eq('domain', validatedQuery.domain)
      .eq('active', true)
      .single();

    if (error || !config) {
      // Log error for debugging
      console.error('[Widget Config API] Query error:', { error, domain: validatedQuery.domain });

      // Domain not found or not configured - return minimal default config
      return NextResponse.json(
        {
          success: false,
          config: {
            domain: validatedQuery.domain,
            woocommerce_enabled: false,
            shopify_enabled: false,
            branding: null,
            appearance: {
              position: 'bottom-right',
              width: 400,
              height: 600,
              showPulseAnimation: true,
              showNotificationBadge: true,
              startMinimized: true,
            },
          },
        },
        { status: 200 } // Return 200 with default config, not 404
      );
    }

    // Fetch widget_configs for enhanced customization (if exists)
    const customerConfigId = domainData?.customer_config_id || config.id;
    const { data: widgetConfig } = await supabase
      .from('widget_configs')
      .select('theme_settings, position_settings, behavior_settings')
      .eq('customer_config_id', customerConfigId)
      .eq('is_active', true)
      .single();

    // Build appearance settings from widget_configs if available
    const appearance = {
      position: widgetConfig?.position_settings?.position || 'bottom-right',
      width: widgetConfig?.position_settings?.width || 400,
      height: widgetConfig?.position_settings?.height || 600,
      showPulseAnimation: widgetConfig?.behavior_settings?.showAvatar ?? true,
      showNotificationBadge: true,
      startMinimized: !widgetConfig?.behavior_settings?.autoOpen,
      primaryColor: widgetConfig?.theme_settings?.primaryColor || config.primary_color || '#3b82f6',
      backgroundColor: widgetConfig?.theme_settings?.backgroundColor || '#ffffff',
      textColor: widgetConfig?.theme_settings?.textColor || '#1f2937',
      borderRadius: widgetConfig?.theme_settings?.borderRadius || '8',
      fontSize: widgetConfig?.theme_settings?.fontSize || '14',
      fontFamily: widgetConfig?.theme_settings?.fontFamily || 'system-ui',
      darkMode: widgetConfig?.theme_settings?.darkMode || false,
    };

    // Build behavior settings
    const behavior = {
      welcomeMessage: widgetConfig?.behavior_settings?.welcomeMessage || config.welcome_message || 'Hi! How can I help you today?',
      placeholderText: widgetConfig?.behavior_settings?.placeholderText || 'Type your message...',
      botName: widgetConfig?.behavior_settings?.botName || 'Assistant',
      avatarUrl: widgetConfig?.behavior_settings?.avatarUrl || '',
      showAvatar: widgetConfig?.behavior_settings?.showAvatar ?? true,
      showTypingIndicator: widgetConfig?.behavior_settings?.showTypingIndicator ?? true,
      autoOpen: widgetConfig?.behavior_settings?.autoOpen || false,
      openDelay: widgetConfig?.behavior_settings?.openDelay || 3000,
      minimizable: widgetConfig?.behavior_settings?.minimizable ?? true,
      soundNotifications: widgetConfig?.behavior_settings?.soundNotifications || false,
      persistConversation: widgetConfig?.behavior_settings?.persistConversation ?? true,
      messageDelay: widgetConfig?.behavior_settings?.messageDelay || 500,
    };

    // Return comprehensive public-safe configuration
    return NextResponse.json({
      success: true,
      config: {
        domain: config.domain,
        woocommerce_enabled: !!config.woocommerce_url,
        shopify_enabled: !!config.shopify_shop,
        branding: {
          business_name: config.business_name,
          primary_color: appearance.primaryColor,
          welcome_message: behavior.welcomeMessage,
          suggested_questions: config.suggested_questions || [],
        },
        appearance,
        behavior,
        features: {
          websiteScraping: { enabled: true },
          woocommerce: { enabled: !!config.woocommerce_url },
          shopify: { enabled: !!config.shopify_shop },
        },
      },
    });

  } catch (error) {
    console.error('[Widget Config API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid domain parameter',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch widget configuration',
      },
      { status: 500 }
    );
  }
}
