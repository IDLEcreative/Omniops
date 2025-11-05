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
  domain: z.string().optional(),
  id: z.string().optional(), // app_id parameter
});

function withCors<T>(response: NextResponse<T>) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Vary', 'Origin');
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// Helper function for default appearance configuration
function getDefaultAppearance() {
  return {
    position: 'bottom-right',
    width: 400,
    height: 600,
    showPulseAnimation: true,
    showNotificationBadge: true,
    startMinimized: true,
    // Default colors matching current widget
    widgetBackgroundColor: '#111111',
    widgetBorderColor: '#2a2a2a',
    headerBackgroundColor: '#111111',
    headerBorderColor: '#2a2a2a',
    headerTextColor: '#ffffff',
    messageAreaBackgroundColor: '#111111',
    userMessageBackgroundColor: '#3f3f46',
    userMessageTextColor: '#ffffff',
    botMessageTextColor: '#ffffff',
    inputAreaBackgroundColor: '#111111',
    inputAreaBorderColor: '#2a2a2a',
    inputBackgroundColor: '#2a2a2a',
    inputBorderColor: '#3a3a3a',
    inputFocusBorderColor: '#4a4a4a',
    inputTextColor: '#ffffff',
    inputPlaceholderColor: '#9ca3af',
    buttonGradientStart: '#3a3a3a',
    buttonGradientEnd: '#2a2a2a',
    buttonTextColor: '#ffffff',
    buttonHoverBackgroundColor: '#1a1a1a',
    fontFamily: 'system-ui',
    fontSize: '14',
    borderRadius: '8',
  };
}

export async function GET(request: NextRequest) {
  try {
    // TEMPORARY WORKAROUND - Domain alias mapping for staging/test environments
    //
    // ⚠️ This is a WORKAROUND and should be REMOVED after proper solution is implemented.
    //
    // PROPER SOLUTION: Add staging domains to customer_configs table in database
    // See: scripts/database/add-staging-domain.sql
    // See: docs/02-GUIDES/GUIDE_MULTI_DOMAIN_SUPPORT.md
    // See: docs/04-ANALYSIS/ANALYSIS_MULTI_DOMAIN_SOLUTION.md
    //
    // Once staging domains are in database, this mapping is unnecessary and should be deleted.
    // Load from environment variable for multi-tenant architecture
    const DOMAIN_ALIASES: Record<string, string> = process.env.DOMAIN_ALIASES
      ? JSON.parse(process.env.DOMAIN_ALIASES)
      : {};
    // Example: DOMAIN_ALIASES='{"staging.example.com":"example.com"}'

    // Parse and validate parameters (supports both domain and app_id)
    const { searchParams } = new URL(request.url);
    let domain = searchParams.get('domain') || '';
    const appId = searchParams.get('id') || '';

    // If domain is empty, try to extract from Referer header (for iframes)
    if (!domain || domain.trim() === '') {
      const referer = request.headers.get('referer') || request.headers.get('referrer');
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          domain = refererUrl.hostname;
          console.log(`[Widget Config API] Domain extracted from referer: ${domain}`);
        } catch (e) {
          console.log('[Widget Config API] Unable to parse referer:', referer);
        }
      }
    }

    // Apply domain alias if exists (TEMPORARY - see comment above)
    const aliasedDomain = domain && DOMAIN_ALIASES[domain];
    if (aliasedDomain) {
      console.log(`[Widget Config API] ⚠️ Using domain alias workaround: ${domain} → ${aliasedDomain}`);
      console.log(`[Widget Config API] ℹ️ Proper fix: Add ${domain} to customer_configs table`);
      domain = aliasedDomain;
    }

    const validatedQuery = QuerySchema.parse({ domain, id: appId });

    // If neither domain nor app_id provided, return default config
    if ((!validatedQuery.domain || validatedQuery.domain.trim() === '') &&
        (!validatedQuery.id || validatedQuery.id.trim() === '')) {
      console.log('[Widget Config API] No domain provided, returning default config');
      return withCors(NextResponse.json(
        {
          success: false,
          message: 'No domain provided - using default configuration',
          config: {
            domain: '',
            woocommerce_enabled: false,
            shopify_enabled: false,
            branding: null,
            appearance: getDefaultAppearance(),
            behavior: {
              welcomeMessage: 'Hi! How can I help you today?',
              placeholderText: 'Type your message...',
              botName: 'Assistant',
            },
          },
        },
        { status: 200 }
      ));
    }

    // Create Supabase client (no auth required for this endpoint)
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    let config;
    let error;
    let domainData;

    // Prioritize app_id lookup over domain lookup (app_id is the new standard)
    if (validatedQuery.id && validatedQuery.id.trim() !== '') {
      // Fetch config by app_id
      const result = await supabase
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
        .eq('app_id', validatedQuery.id)
        .eq('active', true)
        .single();

      config = result.data;
      error = result.error;

      console.log('[Widget Config API] Lookup by app_id:', validatedQuery.id, config ? 'found' : 'not found');
    } else {
      // Fallback to domain-based lookup (legacy method)
      // First, look up domain to get customer_config_id
      domainData = (await supabase
        .from('domains')
        .select('customer_config_id')
        .eq('domain_name', validatedQuery.domain)
        .single()).data;

      // Fetch customer config for this domain
      const result = await supabase
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
        .eq('domain', validatedQuery.domain)
        .eq('active', true)
        .single();

      config = result.data;
      error = result.error;

      console.log('[Widget Config API] Lookup by domain:', validatedQuery.domain, config ? 'found' : 'not found');
    }

    if (error || !config) {
      // Log error for debugging
      console.error('[Widget Config API] Query error:', { error, domain: validatedQuery.domain });

      // Domain not found or not configured - return minimal default config
      return withCors(NextResponse.json(
        {
          success: false,
          config: {
            domain: validatedQuery.domain,
            woocommerce_enabled: false,
            shopify_enabled: false,
            branding: null,
            appearance: getDefaultAppearance(),
          },
        },
        { status: 200 } // Return 200 with default config, not 404
      ));
    }

    // Fetch widget_configs for enhanced customization (if exists)
    const customerConfigId = domainData?.customer_config_id || config.id;
    const { data: widgetConfig } = await supabase
      .from('widget_configs')
      .select('theme_settings, position_settings, behavior_settings, branding_settings')
      .eq('customer_config_id', customerConfigId)
      .eq('is_active', true)
      .single();

    // Extract primary color first (used as fallback for buttons/accents)
    const primaryColor = widgetConfig?.theme_settings?.primaryColor || config.primary_color || '#3b82f6';

    // Build comprehensive appearance settings from widget_configs if available
    // All styling properties needed for fully configuration-driven widget
    const appearance = {
      // Position & Size
      position: widgetConfig?.position_settings?.position || 'bottom-right',
      width: widgetConfig?.position_settings?.width || 400,
      height: widgetConfig?.position_settings?.height || 600,
      showPulseAnimation: widgetConfig?.behavior_settings?.showAvatar ?? true,
      showNotificationBadge: true,
      startMinimized: !widgetConfig?.behavior_settings?.autoOpen,

      // Primary Branding Color (set by customize page)
      primaryColor,

      // Widget Container Colors
      widgetBackgroundColor: widgetConfig?.theme_settings?.widgetBackgroundColor || '#111111',
      widgetBorderColor: widgetConfig?.theme_settings?.widgetBorderColor || '#2a2a2a',

      // Header Colors - Use primaryColor for background if not explicitly set
      headerBackgroundColor: widgetConfig?.theme_settings?.headerBackgroundColor || primaryColor,
      headerBorderColor: widgetConfig?.theme_settings?.headerBorderColor || '#2a2a2a',
      headerTextColor: widgetConfig?.theme_settings?.headerTextColor || '#ffffff',
      headerSubtitle: config.welcome_message || 'Online - We typically reply instantly',

      // Message Area Colors
      messageAreaBackgroundColor: widgetConfig?.theme_settings?.messageAreaBackgroundColor || '#111111',
      userMessageBackgroundColor: widgetConfig?.theme_settings?.userMessageBackgroundColor || '#3f3f46',
      userMessageTextColor: widgetConfig?.theme_settings?.userMessageTextColor || '#ffffff',
      botMessageTextColor: widgetConfig?.theme_settings?.botMessageTextColor || '#ffffff',

      // Input Area Colors
      inputAreaBackgroundColor: widgetConfig?.theme_settings?.inputAreaBackgroundColor || '#111111',
      inputAreaBorderColor: widgetConfig?.theme_settings?.inputAreaBorderColor || '#2a2a2a',
      inputBackgroundColor: widgetConfig?.theme_settings?.inputBackgroundColor || '#2a2a2a',
      inputBorderColor: widgetConfig?.theme_settings?.inputBorderColor || '#3a3a3a',
      inputFocusBorderColor: widgetConfig?.theme_settings?.inputFocusBorderColor || primaryColor,
      inputTextColor: widgetConfig?.theme_settings?.inputTextColor || '#ffffff',
      inputPlaceholderColor: widgetConfig?.theme_settings?.inputPlaceholderColor || '#9ca3af',

      // Button Colors - Use primaryColor for gradients if not explicitly set
      buttonGradientStart: widgetConfig?.theme_settings?.buttonGradientStart || primaryColor,
      buttonGradientEnd: widgetConfig?.theme_settings?.buttonGradientEnd || primaryColor,
      buttonTextColor: widgetConfig?.theme_settings?.buttonTextColor || '#ffffff',
      buttonHoverBackgroundColor: widgetConfig?.theme_settings?.buttonHoverBackgroundColor || primaryColor,

      // Typography
      fontFamily: widgetConfig?.theme_settings?.fontFamily || 'system-ui',
      fontSize: widgetConfig?.theme_settings?.fontSize || '14',
      borderRadius: widgetConfig?.theme_settings?.borderRadius || '8',

      // Legacy/Compatibility (for widgets not yet using new properties)
      backgroundColor: widgetConfig?.theme_settings?.backgroundColor || '#ffffff',
      textColor: widgetConfig?.theme_settings?.textColor || '#1f2937',
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
      animationType: widgetConfig?.behavior_settings?.animationType || 'pulse',
      animationSpeed: widgetConfig?.behavior_settings?.animationSpeed || 'normal',
      animationIntensity: widgetConfig?.behavior_settings?.animationIntensity || 'normal',
    };

    // Return comprehensive public-safe configuration
    return withCors(NextResponse.json({
      success: true,
      config: {
        app_id: config.app_id, // Include app_id in response
        domain: config.domain,
        woocommerce_enabled: !!config.woocommerce_url,
        shopify_enabled: !!config.shopify_shop,
        branding: {
          business_name: config.business_name,
          primary_color: appearance.primaryColor,
          welcome_message: behavior.welcomeMessage,
          suggested_questions: config.suggested_questions || [],
          minimizedIconUrl: widgetConfig?.branding_settings?.minimizedIconUrl || '',
          minimizedIconHoverUrl: widgetConfig?.branding_settings?.minimizedIconHoverUrl || '',
          minimizedIconActiveUrl: widgetConfig?.branding_settings?.minimizedIconActiveUrl || '',
        },
        appearance,
        behavior,
        features: {
          websiteScraping: { enabled: true },
          woocommerce: { enabled: !!config.woocommerce_url },
          shopify: { enabled: !!config.shopify_shop },
        },
      },
    }));

  } catch (error) {
    console.error('[Widget Config API] Error:', error);

    if (error instanceof z.ZodError) {
      return withCors(NextResponse.json(
        {
          success: false,
          error: 'Invalid domain parameter',
          details: error.errors,
        },
        { status: 400 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch widget configuration',
      },
      { status: 500 }
    ));
  }
}
