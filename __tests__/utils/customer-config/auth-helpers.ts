/**
 * Customer Config Security Test - Auth Helpers
 *
 * Reusable authentication utilities for API testing
 */

import type { SupabaseClient } from '@supabase/supabase-js';

interface SignInOptions {
  client: SupabaseClient;
  email: string;
  password: string;
}

interface SignOutOptions {
  client: SupabaseClient;
}

/**
 * Sign in a user and return access token
 */
export async function signInAndGetToken(options: SignInOptions): Promise<string> {
  const { client, email, password } = options;
  const { data: { session } } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (!session?.access_token) {
    throw new Error(`Failed to get access token for ${email}`);
  }

  return session.access_token;
}

/**
 * Sign out a user
 */
export async function signOutUser(options: SignOutOptions): Promise<void> {
  const { client } = options;
  await client.auth.signOut();
}

/**
 * Sign in a user using service client and get token
 */
export async function getAuthTokenFor(
  client: SupabaseClient,
  email: string,
  password: string
): Promise<string> {
  return signInAndGetToken({ client, email, password });
}

/**
 * Create authorization header for fetch requests
 */
export function createAuthHeader(accessToken: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${accessToken}`
  };
}

/**
 * Create authorization and content-type headers
 */
export function createAuthJsonHeaders(accessToken: string): Record<string, string> {
  return {
    ...createAuthHeader(accessToken),
    'Content-Type': 'application/json'
  };
}
