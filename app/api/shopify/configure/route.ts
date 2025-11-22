/**
 * Shopify Configuration API Endpoint
 * Handles saving and updating Shopify credentials
 *
 * Security: Requires authentication, CSRF protection, request signing, rate limiting, and organization membership
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { encrypt } from '@/lib/encryption';
import { withCSRF } from '@/lib/middleware/csrf';
import { logger } from '@/lib/logger';
import { checkEnhancedRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rate-limit-enhanced';
import { verifySignature, getSigningSecret } from '@/lib/security/request-signing';
import { logSecurityEvent } from '@/lib/security/event-logger';

// Input validation constants
const MAX_SHOP_LENGTH = 255;
const MAX_TOKEN_LENGTH = 255;
const MAX_DOMAIN_LENGTH = 255;

async function handlePost(request: NextRequest) {
  try {
    // 0. Check rate limit FIRST
    const ip = getClientIp(request.headers);
    const rateLimitResult = await checkEnhancedRateLimit({
      ip,
      endpoint: '/api/shopify/configure',
    });

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    // 1. Authenticate user
    const authSupabase = await createClient();

    if (!authSupabase) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = await request.json();

    // 2.5. Verify request signature to prevent tampering
    const secret = getSigningSecret();
    const verification = verifySignature(body, secret);

    if (!verification.valid) {
      // Log invalid signature attempt
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                       request.headers.get('x-real-ip') ||
                       'unknown';

      await logSecurityEvent({
        type: 'invalid_signature',
        severity: 'critical',
        userId: user.id,
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || undefined,
        endpoint: '/api/shopify/configure',
        metadata: {
          error: verification.error,
          shop: body.payload?.shop || body.shop || 'unknown'
        },
      });

      return NextResponse.json(
        { success: false, error: verification.error || 'Invalid request signature' },
        { status: 401 }
      );
    }

    // Extract payload from signed request
    const requestData = body.payload || body;
    const { shop, accessToken, domain } = requestData;

    // Validate required fields
    if (!shop || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'Shop domain and access token are required' },
        { status: 400 }
      );
    }

    // Validate input lengths
    if (shop.length > MAX_SHOP_LENGTH) {
      return NextResponse.json(
        { success: false, error: 'Shop domain exceeds maximum length' },
        { status: 400 }
      );
    }

    if (accessToken.length > MAX_TOKEN_LENGTH) {
      return NextResponse.json(
        { success: false, error: 'Access token exceeds maximum length' },
        { status: 400 }
      );
    }

    if (domain && domain.length > MAX_DOMAIN_LENGTH) {
      return NextResponse.json(
        { success: false, error: 'Domain exceeds maximum length' },
        { status: 400 }
      );
    }

    // Validate shop domain format
    if (!shop.includes('.myshopify.com')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shop domain must be in format: store-name.myshopify.com',
        },
        { status: 400 }
      );
    }

    // SECURITY: Block private IP ranges and localhost to prevent SSRF attacks
    try {
      const shopUrl = new URL(`https://${shop}`);
      const hostname = shopUrl.hostname;
      const blockedPatterns = [
        /^localhost$/i,
        /^127\./,                    // 127.0.0.0/8
        /^10\./,                     // 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
        /^192\.168\./,               // 192.168.0.0/16
        /^169\.254\./,               // 169.254.0.0/16 (AWS metadata)
        /^::1$/,                     // IPv6 localhost
        /^fd[0-9a-f]{2}:/i,         // IPv6 private
        /^fe80:/i,                   // IPv6 link-local
      ];

      if (blockedPatterns.some(pattern => pattern.test(hostname))) {
        return NextResponse.json(
          { success: false, error: 'Invalid shop domain: private addresses not allowed' },
          { status: 400 }
        );
      }
    } catch (urlError) {
      return NextResponse.json(
        { success: false, error: 'Invalid shop domain format' },
        { status: 400 }
      );
    }

    // Validate access token format (should start with shpat_)
    if (!accessToken.startsWith('shpat_')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access token should start with "shpat_"',
        },
        { status: 400 }
      );
    }

    // 3. Get service role client for configuration management
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get the domain from request (or use provided domain)
    const customerDomain = domain || request.headers.get('host') || 'localhost';

    // 4. Check if configuration exists and verify organization membership
    const { data: existing } = await supabase
      .from('customer_configs')
      .select('id, organization_id')
      .eq('domain', customerDomain)
      .single();

    // 5. Verify user is member of the organization (for existing configs)
    if (existing) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', existing.organization_id)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        return NextResponse.json(
          { success: false, error: 'Access denied - you do not have permission to modify this domain' },
          { status: 403 }
        );
      }
    }

    // 6. Encrypt the access token
    const encryptedToken = encrypt(accessToken);

    if (existing) {
      // Update existing configuration
      const { error: updateError } = await supabase
        .from('customer_configs')
        .update({
          shopify_shop: shop,
          shopify_access_token: encryptedToken,
          updated_at: new Date().toISOString(),
        })
        .eq('domain', customerDomain);

      if (updateError) {
        logger.error('Failed to update Shopify config', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update configuration' },
          { status: 500 }
        );
      }
    } else {
      // Create new configuration
      const { error: insertError } = await supabase
        .from('customer_configs')
        .insert({
          domain: customerDomain,
          shopify_shop: shop,
          shopify_access_token: encryptedToken,
        });

      if (insertError) {
        logger.error('Failed to create Shopify config', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to save configuration' },
          { status: 500 }
        );
      }
    }

    // Log successful credential update (audit trail)
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    await logSecurityEvent({
      type: 'credential_update',
      severity: 'low',
      userId: user.id,
      ip: clientIP,
      userAgent: request.headers.get('user-agent') || undefined,
      endpoint: '/api/shopify/configure',
      metadata: {
        domain: customerDomain,
        shop,
        action: existing ? 'update' : 'create',
        organizationId: existing?.organization_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Shopify configuration saved successfully',
    });
  } catch (error: any) {
    logger.error('Shopify Configure API Error', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save configuration',
      },
      { status: 500 }
    );
  }
}

// Export POST handler with CSRF protection
export const POST = withCSRF(handlePost);

export async function GET(request: Request) {
  try {
    // 0. Check rate limit FIRST
    const ip = getClientIp(request.headers);
    const rateLimitResult = await checkEnhancedRateLimit({
      ip,
      endpoint: '/api/shopify/configure',
    });

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // 1. Authenticate user
    const authSupabase = await createClient();

    if (!authSupabase) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get domain parameter
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || request.headers.get('host') || 'localhost';

    // 3. Get service role client
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // 4. Fetch existing configuration (without exposing the token)
    const { data: config, error } = await supabase
      .from('customer_configs')
      .select('shopify_shop, organization_id')
      .eq('domain', domain)
      .single();

    if (error || !config) {
      return NextResponse.json({
        success: true,
        configured: false,
        shop: null,
      });
    }

    // 5. Verify user is member of the organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', config.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Access denied - you do not have permission to view this domain' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      configured: true,
      shop: config.shopify_shop,
    });
  } catch (error: any) {
    logger.error('Shopify Configure API Error (GET)', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch configuration',
      },
      { status: 500 }
    );
  }
}
