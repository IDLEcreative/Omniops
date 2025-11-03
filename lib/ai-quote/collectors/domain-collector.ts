/**
 * Domain Data Collector
 * Fetches WHOIS and domain registration information
 */

import { DomainData } from '../types';

export async function collectDomainData(domain: string): Promise<DomainData> {
  try {
    // Try WHOIS lookup
    const whoisData = await whoisLookup(domain);

    if (whoisData) {
      return whoisData;
    }

    // Fallback: minimal data
    return {
      domainAge: 0
    };
  } catch (error) {
    console.error('Domain data collection failed:', error);
    return {
      domainAge: 0
    };
  }
}

async function whoisLookup(domain: string): Promise<DomainData | null> {
  try {
    // Use WHOIS API - try free service first
    // whois-json package would work here, but we'll use a REST API instead
    // to avoid additional npm dependencies

    const response = await fetch(`https://whois-api.com/api/v1?domain=${domain}`, {
      headers: {
        'User-Agent': 'AIQuoteBot/1.0'
      }
    });

    if (!response.ok) {
      // Fallback to a different service
      return whoisLookupAlternative(domain);
    }

    const data = await response.json();

    if (!data.result) {
      return null;
    }

    const createdDate = parseDate(data.result.registrar_iana_id);
    const domainAge = createdDate
      ? Math.floor(
          (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
        )
      : 0;

    return {
      domainAge,
      registrar: data.result.registrar,
      createdDate,
      expiresDate: parseDate(data.result.expiration_date),
      nameservers: data.result.nameservers
    };
  } catch (error) {
    console.error('WHOIS lookup error:', error);
    return null;
  }
}

async function whoisLookupAlternative(domain: string): Promise<DomainData | null> {
  try {
    // Fallback to alternative WHOIS service
    const response = await fetch(
      `https://api.whoisxmlapi.com/api/v1?apiKey=${process.env.WHOIS_API_KEY}&domain=${domain}`,
      {
        headers: {
          'User-Agent': 'AIQuoteBot/1.0'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.WhoisRecord) {
      return null;
    }

    const createdDate = parseDate(data.WhoisRecord.createdDate);
    const domainAge = createdDate
      ? Math.floor(
          (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
        )
      : 0;

    return {
      domainAge,
      registrar: data.WhoisRecord.registrar,
      createdDate,
      expiresDate: parseDate(data.WhoisRecord.expiresDate),
      nameservers: data.WhoisRecord.nameServers
    };
  } catch (error) {
    console.error('Alternative WHOIS lookup error:', error);
    return null;
  }
}

function parseDate(dateString: string | undefined): Date | undefined {
  if (!dateString) return undefined;

  try {
    const date = new Date(dateString);
    // Validate it's a reasonable date
    if (date.getFullYear() > 1990 && date.getFullYear() < 2100) {
      return date;
    }
  } catch {
    // Invalid date
  }

  return undefined;
}
