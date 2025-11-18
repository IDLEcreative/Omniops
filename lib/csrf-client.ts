/**
 * Client-side CSRF token management
 *
 * Provides functions for fetching and managing CSRF tokens in the browser.
 * Tokens are stored in memory and automatically included in API requests.
 */

let csrfToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Fetches a new CSRF token from the server
 * @returns Promise resolving to the CSRF token string
 */
export async function fetchCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf');

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.csrfToken) {
      throw new Error('CSRF token not found in response');
    }

    // Store token and expiry
    csrfToken = data.csrfToken;
    tokenExpiry = Date.now() + (data.expiresIn * 1000);

    return data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Gets the current CSRF token, fetching a new one if needed
 * @returns Promise resolving to the current CSRF token
 */
export async function getCSRFToken(): Promise<string> {
  // Check if token exists and hasn't expired
  if (csrfToken && tokenExpiry && Date.now() < tokenExpiry) {
    return csrfToken;
  }

  // Fetch new token
  return fetchCSRFToken();
}

/**
 * Clears the stored CSRF token (useful for logout)
 */
export function clearCSRFToken(): void {
  csrfToken = null;
  tokenExpiry = null;
}

/**
 * Creates headers object with CSRF token included
 * @param additionalHeaders - Optional additional headers to include
 * @returns Promise resolving to headers object with CSRF token
 */
export async function getCSRFHeaders(additionalHeaders?: Record<string, string>): Promise<HeadersInit> {
  const token = await getCSRFToken();

  return {
    'X-CSRF-Token': token,
    ...additionalHeaders,
  };
}
