/**
 * WhatsApp OAuth Authorization Endpoint
 *
 * Initiates OAuth flow with Meta/Facebook for WhatsApp Business API access.
 * Customer clicks "Connect WhatsApp" → redirected to Meta → authorized → redirected back to callback.
 *
 * Similar to "Connect with Shopify" or "Connect with Stripe" flows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const domain = request.nextUrl.searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter required' },
        { status: 400 }
      );
    }

    // Verify domain belongs to authenticated user
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to initialize database client' },
        { status: 500 }
      );
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        domain,
        user_id: user.id,
        timestamp: Date.now(),
        nonce: crypto.randomUUID(),
      })
    ).toString('base64url');

    // Store state in session for verification
    const response = NextResponse.redirect(getMetaOAuthUrl(state));
    response.cookies.set('whatsapp_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;

  } catch (error) {
    console.error('WhatsApp OAuth authorize error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}

/**
 * Generate Meta OAuth URL for WhatsApp Business API
 *
 * Scopes requested:
 * - whatsapp_business_messaging: Send and receive messages
 * - whatsapp_business_management: Manage phone numbers, templates
 */
function getMetaOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/oauth/callback`,
    state,
    scope: [
      'whatsapp_business_messaging',
      'whatsapp_business_management',
    ].join(','),
    response_type: 'code',
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}
