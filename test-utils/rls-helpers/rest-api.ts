/**
 * RLS Test Helpers - REST API
 * Direct REST API helpers for Supabase database operations
 */

import fetch from 'cross-fetch';

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
 * Direct REST API helper for Supabase database operations
 * Uses raw fetch instead of SDK to avoid Jest compatibility issues
 */
export async function supabaseRestInsert(
  table: string,
  data: Record<string, any>,
  options: { select?: boolean; serviceRole?: boolean } = {}
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': options.serviceRole ? getServiceRoleKey() : getSupabaseAnonKey(),
    'Prefer': 'return=representation'
  };

  if (options.serviceRole) {
    headers['Authorization'] = `Bearer ${getServiceRoleKey()}`;
  }

  const response = await nativeFetch(
    `${getSupabaseUrl()}/rest/v1/${table}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert into ${table}: ${response.status} ${error}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Direct REST API DELETE helper
 */
export async function supabaseRestDelete(
  table: string,
  filter: Record<string, any> | string,
  options: { serviceRole?: boolean } = {}
): Promise<void> {
  let queryString = '';
  if (typeof filter === 'string') {
    queryString = filter;
  } else {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      params.append(key, `eq.${value}`);
    });
    queryString = params.toString();
  }

  const headers: Record<string, string> = {
    'apikey': options.serviceRole ? getServiceRoleKey() : getSupabaseAnonKey()
  };

  if (options.serviceRole) {
    headers['Authorization'] = `Bearer ${getServiceRoleKey()}`;
  }

  const response = await nativeFetch(
    `${getSupabaseUrl()}/rest/v1/${table}?${queryString}`,
    {
      method: 'DELETE',
      headers
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete from ${table}: ${response.status} ${error}`);
  }
}

/**
 * Direct REST API SELECT helper
 */
export async function supabaseRestSelect(
  table: string,
  filter: Record<string, any> = {},
  options: { serviceRole?: boolean; accessToken?: string; select?: string } = {}
): Promise<any[]> {
  const params = new URLSearchParams();

  Object.entries(filter).forEach(([key, value]) => {
    params.append(key, `eq.${value}`);
  });

  if (options.select) {
    params.append('select', options.select);
  }

  const headers: Record<string, string> = {
    'apikey': options.serviceRole ? getServiceRoleKey() : getSupabaseAnonKey()
  };

  if (options.serviceRole) {
    headers['Authorization'] = `Bearer ${getServiceRoleKey()}`;
  } else if (options.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  const response = await nativeFetch(
    `${getSupabaseUrl()}/rest/v1/${table}?${params.toString()}`,
    {
      method: 'GET',
      headers
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to select from ${table}: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Test helper to query database as a specific user (for RLS testing)
 */
export async function queryAsUser(
  email: string,
  table: string,
  filter: Record<string, any> = {}
): Promise<any[]> {
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
  return supabaseRestSelect(table, filter, { accessToken: data.access_token });
}

/**
 * Test helper to query database with admin privileges (bypasses RLS)
 */
export async function queryAsAdmin(
  table: string,
  filter: Record<string, any> = {}
): Promise<any[]> {
  return supabaseRestSelect(table, filter, { serviceRole: true });
}

/**
 * Test helper to insert data as admin
 */
export async function insertAsAdmin(
  table: string,
  data: Record<string, any>
): Promise<any> {
  return supabaseRestInsert(table, data, { serviceRole: true });
}

/**
 * Test helper to delete data as admin
 */
export async function deleteAsAdmin(
  table: string,
  filter: Record<string, any>
): Promise<void> {
  return supabaseRestDelete(table, filter, { serviceRole: true });
}
