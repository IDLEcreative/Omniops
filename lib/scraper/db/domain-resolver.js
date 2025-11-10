/**
 * Domain Resolver
 *
 * Extracts domain from URL and looks up domain ID from database.
 * This module centralizes domain resolution logic used across the scraping system.
 */

/**
 * Resolves domain ID from a page URL
 *
 * Extracts the domain portion from a full URL (removing www. prefix),
 * then queries the database to find the corresponding domain ID.
 *
 * @param {string} pageUrl - Full page URL (e.g., "https://example.com/page" or "https://www.example.com/page")
 * @param {Object} supabase - Supabase client instance
 * @returns {Promise<string|null>} Domain ID if found, null otherwise
 *
 * @example
 * const domainId = await resolveDomainId('https://www.example.com/page', supabase);
 * if (domainId) {
 *   console.log('Domain ID:', domainId);
 * } else {
 *   console.warn('Domain not found in database');
 * }
 *
 * @example
 * // Handles URLs without www.
 * const domainId = await resolveDomainId('https://example.com/page', supabase);
 *
 * @notes
 * - Returns null if URL is malformed or domain not found in database
 * - Logs warnings for missing domains (helps with debugging)
 * - Silently handles Supabase errors (returns null)
 * - Normalizes domain by removing www. prefix
 */
export async function resolveDomainId(pageUrl, supabase) {
  try {
    // Extract domain from URL
    const domainMatch = pageUrl.match(/https?:\/\/([^\/]+)/);
    if (!domainMatch) {
      console.warn('[DomainResolver] Invalid URL format:', pageUrl);
      return null;
    }

    // Normalize domain (remove www. prefix)
    const domain = domainMatch[1].replace('www.', '');

    // Query database for domain ID
    const { data: domainData, error } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', domain)
      .single();

    if (error) {
      // Log error but don't throw (graceful degradation)
      console.warn('[DomainResolver] Database query failed for domain:', domain, error.message);
      return null;
    }

    if (!domainData) {
      console.warn('[DomainResolver] Domain not found in database:', domain);
      return null;
    }

    return domainData.id;
  } catch (err) {
    // Catch any unexpected errors
    console.error('[DomainResolver] Unexpected error:', err.message);
    return null;
  }
}
