/**
 * Supabase MCP Validators
 *
 * Validation functions for Supabase MCP functionality checks
 */

export interface FunctionResult {
  name: string;
  description: string;
  ok: boolean | null;
  notes?: string;
}

export interface CategoryResult {
  category: string;
  status: string;
  functions: FunctionResult[];
}

/**
 * Compute category status from function results
 */
export function computeCategoryStatus(functions: FunctionResult[]): string {
  const totals = functions.reduce(
    (acc, fn) => {
      if (fn.ok === true) acc.ok += 1;
      else if (fn.ok === null) acc.skipped += 1;
      else acc.failed += 1;
      return acc;
    },
    { ok: 0, failed: 0, skipped: 0 }
  );

  if (totals.ok === functions.length && functions.length > 0) return '✅ WORKING';
  if (totals.ok > 0 && totals.failed === 0) return '⚠️  PARTIAL';
  if (totals.ok > 0) return '⚠️  PARTIAL';
  if (totals.skipped === functions.length) return '⚠️  NOT CONFIGURED';
  return '❌ FAILED';
}

/**
 * Make Management API request
 */
export async function managementRequest(
  path: string,
  accessToken: string,
  { method = 'GET', body }: { method?: string; body?: any } = {}
): Promise<{ ok: boolean; statusCode: number; message?: string; data?: any }> {
  if (!accessToken) {
    return { ok: false, statusCode: 0, message: 'Missing SUPABASE_ACCESS_TOKEN' };
  }

  try {
    const response = await fetch(`https://api.supabase.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        (data && typeof data === 'object' && (data.message || data.error)) ||
        text ||
        `Status ${response.status}`;
      return { ok: false, statusCode: response.status, message, data };
    }

    return { ok: true, statusCode: response.status, data };
  } catch (error: any) {
    return { ok: false, statusCode: 0, message: error.message };
  }
}

/**
 * Execute SQL query via Management API
 */
export async function runSql(
  query: string,
  projectRef: string,
  accessToken: string
): Promise<{ ok: boolean; message?: string; data?: any }> {
  if (!projectRef) {
    return { ok: false, message: 'Missing project reference (set SUPABASE_PROJECT_REF).' };
  }

  return managementRequest(`/v1/projects/${projectRef}/database/query`, accessToken, {
    method: 'POST',
    body: { query }
  });
}
