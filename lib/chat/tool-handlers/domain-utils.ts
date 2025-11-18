/**
 * Domain validation and normalization utilities
 */

/**
 * Normalize and validate domain
 * Returns normalized domain or null if invalid
 */
export function normalizeDomain(domain: string): string | null {
  const normalized = domain.replace(/^https?:\/\//, '').replace('www.', '');

  if (!normalized || /localhost|127\.0\.0\.1/i.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Check if domain is valid for operations
 */
export function isValidDomain(domain: string): boolean {
  return normalizeDomain(domain) !== null;
}
