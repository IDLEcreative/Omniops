import { NextRequest, NextResponse } from 'next/server';
import { InstagramOAuth } from '@/lib/instagram-oauth';
import { encrypt } from '@/lib/encryption';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/instagram/callback
 * OAuth callback handler for Instagram Business account connection
 *
 * This endpoint is called by Meta after user approves permissions.
 * It exchanges the authorization code for an access token and stores
 * encrypted credentials in the database.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL not configured');
    }

    // Handle OAuth errors (user denied permission)
    if (error) {
      console.error('❌ OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_denied&message=${encodeURIComponent(errorDescription || error)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('❌ Missing code or state in OAuth callback');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=invalid_callback`
      );
    }

    // Parse state (format: "customerId:stateToken")
    const [customerId, stateToken] = state.split(':');

    if (!customerId || !stateToken) {
      console.error('❌ Invalid state format');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=invalid_state`
      );
    }

    // Verify state token (CSRF protection)
    const supabase = await createClient();
    if (!supabase) {
      console.error('❌ Failed to initialize database client');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=server_error`
      );
    }

    const { data: creds, error: credsError } = await supabase
      .from('instagram_credentials')
      .select('oauth_state')
      .eq('customer_id', customerId)
      .single();

    if (credsError || !creds || creds.oauth_state !== stateToken) {
      console.error('❌ Invalid state token - possible CSRF attack');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=invalid_state`
      );
    }


    // Exchange code for access token
    const oauth = new InstagramOAuth();
    const tokenData = await oauth.exchangeCodeForToken(code);


    // Get Instagram account details
    const accountInfo = await oauth.getInstagramAccount(tokenData.access_token);


    // Store encrypted credentials
    const { error: updateError } = await supabase
      .from('instagram_credentials')
      .update({
        encrypted_access_token: encrypt(tokenData.access_token),
        encrypted_page_id: encrypt(accountInfo.pageId),
        encrypted_instagram_account_id: encrypt(accountInfo.instagramAccountId),
        instagram_username: accountInfo.username,
        instagram_name: accountInfo.name,
        access_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
        scopes: tokenData.scopes || ['instagram_basic', 'instagram_manage_messages', 'pages_manage_metadata'],
        is_active: true,
        oauth_completed_at: new Date(),
        oauth_state: null, // Clear state after use
      })
      .eq('customer_id', customerId);

    if (updateError) {
      console.error('❌ Failed to store credentials:', updateError);
      throw new Error('Failed to store Instagram credentials');
    }


    // Subscribe to webhooks
    try {
      await oauth.subscribeToWebhooks(accountInfo.pageId, tokenData.access_token);
    } catch (webhookError) {
      console.error('⚠️ Webhook subscription failed (non-fatal):', webhookError);
      // Don't fail the entire flow if webhook subscription fails
      // User can retry later or webhooks can be configured manually
    }


    // Redirect back to dashboard with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=instagram_connected&username=${encodeURIComponent(accountInfo.username)}`
    );

  } catch (error) {
    console.error('❌ OAuth callback error:', error);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const errorMessage = error instanceof Error ? error.message : 'OAuth failed';

    return NextResponse.redirect(
      `${appUrl}/dashboard/integrations?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`
    );
  }
}
