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
    const DOMAIN_ALIASES: Record<string, string> = {
      'epartstaging.wpengine.com': 'thompsonseparts.co.uk',
      'www.epartstaging.wpengine.com': 'thompsonseparts.co.uk',
      // Add more staging → production mappings here as needed
    };

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
    if (domain && DOMAIN_ALIASES[domain]) {
      console.log(`[Widget Config API] ⚠️ Using domain alias workaround: ${domain} → ${DOMAIN_ALIASES[domain]}`);
      console.log(`[Widget Config API] ℹ️ Proper fix: Add ${domain} to customer_configs table`);
      domain = DOMAIN_ALIASES[domain];
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
            appearance: {
              position: 'bottom-right',
              width: 400,
              height: 600,
              showPulseAnimation: true,
              showNotificationBadge: true,
              startMinimized: true,
            },
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
      ));
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
