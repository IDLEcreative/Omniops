/**
 * Customer Config Security Test - API Request Helpers
 *
 * Reusable fetch helpers for API testing
 */

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

interface ApiResponse {
  status: number;
  data: any;
}

/**
 * Make authenticated API request to customer config endpoint
 */
export async function apiRequest(
  path: string,
  options: FetchOptions = {}
): Promise<ApiResponse> {
  const { method = 'GET', headers = {}, body } = options;

  const fetchOptions: RequestInit = {
    method,
    headers
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`http://localhost:3000${path}`, fetchOptions);
  const data = await response.json();

  return { status: response.status, data };
}

/**
 * GET /api/customer/config
 */
export async function getConfigs(authToken?: string): Promise<ApiResponse> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return apiRequest('/api/customer/config', { headers });
}

/**
 * POST /api/customer/config
 */
export async function createConfig(
  domain: string,
  businessName: string,
  authToken?: string
): Promise<ApiResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return apiRequest('/api/customer/config', {
    method: 'POST',
    headers,
    body: { domain, business_name: businessName }
  });
}

/**
 * PUT /api/customer/config
 */
export async function updateConfig(
  configId: string,
  updates: Record<string, any>,
  authToken?: string
): Promise<ApiResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return apiRequest(`/api/customer/config?id=${configId}`, {
    method: 'PUT',
    headers,
    body: updates
  });
}

/**
 * DELETE /api/customer/config
 */
export async function deleteConfig(
  configId: string,
  authToken?: string
): Promise<ApiResponse> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return apiRequest(`/api/customer/config?id=${configId}`, {
    method: 'DELETE',
    headers
  });
}
