/**
 * WhatsApp OAuth Callback Endpoint
 *
 * Handles redirect from Meta after OAuth authorization.
 * Exchanges authorization code for access token and stores encrypted in database.
 *
 * Flow: Meta redirects here → exchange code for token → store token → redirect to dashboard with success message
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const error = request.nextUrl.searchParams.get('error');
    const errorReason = request.nextUrl.searchParams.get('error_reason');
    const errorDescription = request.nextUrl.searchParams.get('error_description');

    // Handle OAuth errors (user denied, etc.)
    if (error) {
      console.error('WhatsApp OAuth error:', { error, errorReason, errorDescription });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?` +
        `whatsapp_error=${encodeURIComponent(errorDescription || 'OAuth failed')}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    // Verify state to prevent CSRF
    const storedState = request.cookies.get('whatsapp_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: 'Invalid state parameter - possible CSRF attack' },
        { status: 403 }
      );
    }

    // Decode state to get domain and user_id
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { domain, user_id, timestamp } = stateData;

    // Check state hasn't expired (10 minutes)
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return NextResponse.json(
        { error: 'OAuth state expired - please try again' },
        { status: 400 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/oauth/callback`,
        code,
      }).toString()
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in, token_type } = tokenData;

    // Get WhatsApp Business Account info
    const wabas = await getWhatsAppBusinessAccounts(access_token);

    if (wabas.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?` +
        `whatsapp_error=${encodeURIComponent('No WhatsApp Business Accounts found')}`
      );
    }

    // Use first WABA (in production, let user select if multiple)
    const waba = wabas[0];
    const phoneNumbers = await getWhatsAppPhoneNumbers(access_token, waba?.id || '');

    if (phoneNumbers.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?` +
        `whatsapp_error=${encodeURIComponent('No phone numbers found for WhatsApp Business Account')}`
      );
    }

    // Use first phone number (in production, let user select if multiple)
    const phoneNumber = phoneNumbers[0];

    // Store OAuth token and WhatsApp config in database
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to initialize database client' },
        { status: 500 }
      );
    }

    // Get customer config
    const { data: config } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', domain)
      .single();

    if (!config) {
      return NextResponse.json(
        { error: 'Customer config not found' },
        { status: 404 }
      );
    }

    // Encrypt access token
    const encryptedToken = encrypt(access_token);

    // Update customer_configs with WhatsApp info
    await supabase
      .from('customer_configs')
      .update({
        whatsapp_phone_number: phoneNumber.display_phone_number,
        whatsapp_phone_number_id: phoneNumber.id,
        whatsapp_business_account_id: waba?.id || '',
        whatsapp_provider: 'meta',
        whatsapp_enabled: true,
        whatsapp_oauth_connected_at: new Date().toISOString(),
        whatsapp_oauth_scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
      })
      .eq('id', config.id);

    // Store OAuth token in whatsapp_oauth_tokens table
    await supabase
      .from('whatsapp_oauth_tokens')
      .upsert({
        customer_config_id: config.id,
        provider: 'meta',
        access_token_encrypted: encryptedToken,
        expires_at: expires_in
          ? new Date(Date.now() + expires_in * 1000).toISOString()
          : null,
        scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
        token_metadata: {
          token_type,
          waba_id: waba?.id || '',
          waba_name: waba?.name || '',
          phone_number_id: phoneNumber?.id || '',
          phone_number: phoneNumber?.display_phone_number || '',
        },
      });

    // Clear OAuth state cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?whatsapp_connected=true`
    );
    response.cookies.delete('whatsapp_oauth_state');

    return response;

  } catch (error) {
    console.error('WhatsApp OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?` +
      `whatsapp_error=${encodeURIComponent('Failed to complete OAuth flow')}`
    );
  }
}

/**
 * Get WhatsApp Business Accounts for the authorized user
 */
async function getWhatsAppBusinessAccounts(accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/businesses?` +
    new URLSearchParams({
      fields: 'id,name,whatsapp_business_accounts{id,name}',
      access_token: accessToken,
    }).toString()
  );

  const data = await response.json();

  // Extract WABAs from all businesses
  const wabas: Array<{ id: string; name: string }> = [];
  for (const business of data.data || []) {
    if (business.whatsapp_business_accounts?.data) {
      wabas.push(...business.whatsapp_business_accounts.data);
    }
  }

  return wabas;
}

/**
 * Get phone numbers for a WhatsApp Business Account
 */
async function getWhatsAppPhoneNumbers(accessToken: string, wabaId: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?` +
    new URLSearchParams({
      access_token: accessToken,
    }).toString()
  );

  const data = await response.json();
  return data.data || [];
}
