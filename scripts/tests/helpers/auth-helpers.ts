/**
 * Authentication helpers for analytics security tests
 */

import { createClient } from '@supabase/supabase-js';
import { log } from './test-runner';

export async function authenticateUser(
  email: string,
  password: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session) {
    log(`Failed to authenticate ${email}: ${error?.message}`, 'red');
    return null;
  }

  return data.session.access_token;
}

export async function makeRequest(
  path: string,
  baseUrl: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers
  });
}
