/**
 * RLS Test Helpers - User Management
 * Test user creation, authentication, and cleanup
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import fetch from 'cross-fetch';
import { supabaseRestDelete } from './rest-api';

const nativeFetch = fetch;

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
}

function getServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY!;
}

/**
 * Helper to get access token from a user client
 */
export async function getUserAccessToken(email: string): Promise<string> {
  const password = process.env.TEST_USER_PASSWORD || 'test-password-123';

  const response = await nativeFetch(
    `${getSupabaseUrl()}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': getSupabaseAnonKey()
      },
      body: JSON.stringify({ email, password })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get access token for ${email}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a Supabase admin client with service role permissions
 * IMPORTANT: This client bypasses RLS policies - use only for test infrastructure
 */
export function createAdminClient() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();

  if (!url || !key) {
    throw new Error('Missing Supabase credentials for admin client creation');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: globalThis.fetch
    }
  });
}

/**
 * Create a Supabase client with a specific user session
 * This creates a client that respects RLS policies for the given user
 */
export async function createUserClient(
  userId: string,
  email: string
): Promise<SupabaseClient> {
  const password = process.env.TEST_USER_PASSWORD || 'test-password-123';

  const response = await nativeFetch(
    `${getSupabaseUrl()}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': getSupabaseAnonKey()
      },
      body: JSON.stringify({ email, password })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to sign in test user ${email}: ${response.status} ${error}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(`No access token returned for test user ${email}`);
  }

  const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${data.access_token}`
      }
    }
  });

  return client;
}

/**
 * Create a test user in Supabase Auth
 * Use this in beforeAll() to set up test users
 */
export async function createTestUser(
  email: string,
  metadata: Record<string, any> = {}
): Promise<string> {
  const response = await nativeFetch(
    `${getSupabaseUrl()}/auth/v1/admin/users`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getServiceRoleKey()}`,
        'Content-Type': 'application/json',
        'apikey': getServiceRoleKey()
      },
      body: JSON.stringify({
        email,
        password: process.env.TEST_USER_PASSWORD || 'test-password-123',
        email_confirm: true,
        user_metadata: metadata
      })
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Failed to create test user ${email}: ${response.status} ${responseText}`
    );
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error(
      `Failed to parse create user response for ${email}. Status: ${response.status}`
    );
  }

  if (!data.id && !data.user?.id) {
    throw new Error(`No user ID returned when creating test user ${email}`);
  }

  return data.id || data.user?.id;
}

/**
 * Delete a test user
 * Use this in afterAll() to clean up test users
 */
export async function deleteTestUser(userId: string): Promise<void> {
  try {
    try {
      await supabaseRestDelete('organization_members', { user_id: userId }, { serviceRole: true });
    } catch (memberError) {
      // Ignore errors - member may already be deleted
    }

    const response = await nativeFetch(
      `${getSupabaseUrl()}/auth/v1/admin/users/${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getServiceRoleKey()}`,
          'apikey': getServiceRoleKey()
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      if (error.includes('constraint') || error.includes('referenced') || error.includes('unexpected_failure')) {
        console.warn(`Could not delete test user ${userId}, may have remaining references`);
        return;
      }
      throw new Error(`Failed to delete test user ${userId}: ${response.status} ${error}`);
    }
  } catch (error: any) {
    console.warn(`Error during test user cleanup for ${userId}:`, error.message);
  }
}
