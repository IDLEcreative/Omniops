/**
 * Domain Utilities
 *
 * Handles domain extraction and alias resolution.
 */

import type { NextRequest } from 'next/server';

/**
 * Extract domain from referer header if domain param is empty
 */
export function extractDomainFromReferer(request: NextRequest, domain: string): string {
  if (!domain || domain.trim() === '') {
    const referer = request.headers.get('referer') || request.headers.get('referrer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const extractedDomain = refererUrl.hostname;
        return extractedDomain;
      } catch (e) {
      }
    }
  }
  return domain;
}

/**
 * Apply domain alias if configured
 *
 * TEMPORARY WORKAROUND - Domain alias mapping for staging/test environments
 *
 * ⚠️ This is a WORKAROUND and should be REMOVED after proper solution is implemented.
 *
 * PROPER SOLUTION: Add staging domains to customer_configs table in database
 * See: scripts/database/add-staging-domain.sql
 * See: docs/02-GUIDES/GUIDE_MULTI_DOMAIN_SUPPORT.md
 * See: docs/04-ANALYSIS/ANALYSIS_MULTI_DOMAIN_SOLUTION.md
 *
 * Once staging domains are in database, this mapping is unnecessary and should be deleted.
 */
export function applyDomainAlias(domain: string): string {
  // Load from environment variable for multi-tenant architecture
  const DOMAIN_ALIASES: Record<string, string> = process.env.DOMAIN_ALIASES
    ? JSON.parse(process.env.DOMAIN_ALIASES)
    : {};
  // Example: DOMAIN_ALIASES='{"staging.example.com":"example.com"}'

  const aliasedDomain = domain && DOMAIN_ALIASES[domain];
  if (aliasedDomain) {
    return aliasedDomain;
  }

  return domain;
}
