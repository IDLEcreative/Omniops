/**
 * Business Intelligence Data Collector
 * Orchestrates parallel data collection from all sources
 */

import { BusinessIntelligence } from './types';
import { collectWebsiteData } from './collectors/website-collector';
import { collectCompanyData } from './collectors/company-collector';
import { collectTrafficData } from './collectors/traffic-collector';
import { collectDomainData } from './collectors/domain-collector';

export async function collectBusinessIntelligence(
  domain: string
): Promise<BusinessIntelligence> {
  // Normalize domain
  const normalizedDomain = normalizeDomain(domain);

  // Collect all data in parallel for speed
  const [website, company, domainInfo] = await Promise.all([
    collectWebsiteData(normalizedDomain),
    collectCompanyData(normalizedDomain),
    collectDomainData(normalizedDomain)
  ]);

  // Collect traffic (depends on website data)
  const traffic = await collectTrafficData(normalizedDomain, website);

  return {
    domain: normalizedDomain,
    collectedAt: new Date(),
    traffic,
    website,
    company,
    domainInfo
  };
}

function normalizeDomain(domain: string): string {
  // Remove protocol if present
  let normalized = domain.replace(/^https?:\/\//, '').toLowerCase().trim();

  // Remove www prefix
  normalized = normalized.replace(/^www\./, '');

  // Remove path
  normalized = (normalized.split('/')[0] || '').trim();

  // Remove port
  normalized = (normalized.split(':')[0] || '').trim();

  return normalized;
}
