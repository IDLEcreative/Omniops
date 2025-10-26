/**
 * WooCommerce Proxy Authentication
 *
 * Handles authentication and authorization for WooCommerce API proxy
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: NextResponse;
}

/**
 * Authenticate user via Supabase
 * Returns error response if authentication fails
 */
export async function authenticateUser(): Promise<AuthResult> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Failed to initialize Supabase client' },
        { status: 500 }
      )
    };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    };
  }

  return {
    success: true,
    userId: user.id
  };
}
