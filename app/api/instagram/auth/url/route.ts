import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

const urlSchema = z.object({
  customerId: z.string().uuid(),
});

/**
 * POST /api/instagram/auth/url
 * Generate OAuth URL for Instagram Business account connection
 *
 * This endpoint creates a secure OAuth URL that redirects users to Meta's
 * OAuth dialog. A state token is generated for CSRF protection.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = urlSchema.parse(body);

    // Validate environment variables
    if (!process.env.INSTAGRAM_APP_ID) {
      throw new Error('INSTAGRAM_APP_ID not configured');
    }
    if (!process.env.INSTAGRAM_REDIRECT_URI) {
      throw new Error('INSTAGRAM_REDIRECT_URI not configured');
    }

    // Generate secure state token (CSRF protection)
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in database temporarily
    // This will be verified when user returns from OAuth
    const supabase = await createClient();
    if (!supabase) {
      throw new Error('Failed to initialize database client');
    }

    const { error } = await supabase
      .from('instagram_credentials')
      .upsert({
        customer_id: customerId,
        oauth_state: state,
        is_active: false, // Not active until OAuth completes
        webhook_verify_token: crypto.randomBytes(32).toString('hex'), // Generate webhook token
      });

    if (error) {
      console.error('❌ Failed to store OAuth state:', error);
      throw new Error('Failed to initialize OAuth flow');
    }

    // Build Meta OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      scope: 'instagram_basic,instagram_manage_messages,pages_manage_metadata',
      response_type: 'code',
      state: `${customerId}:${state}`, // Include customer ID in state
    });

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;

    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('❌ OAuth URL generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
