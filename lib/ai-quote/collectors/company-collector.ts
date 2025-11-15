/**
 * Company Data Collector
 * Uses Companies House API to fetch official company information
 */

import { CompanyData } from '../types';

const COMPANIES_HOUSE_API_BASE = 'https://api.company-information.service.gov.uk';

export async function collectCompanyData(domain: string): Promise<CompanyData> {
  try {
    // Extract company name from domain
    const companyName = extractCompanyNameFromDomain(domain);

    // Try Companies House API
    const ukCompany = await searchCompaniesHouse(companyName);

    if (ukCompany) {
      return parseCompaniesHouseData(ukCompany);
    }

    // Fallback: return basic info
    return {
      name: companyName,
      companyStatus: 'unknown'
    };
  } catch (error) {
    console.error('Company data collection failed:', error);
    return {
      name: 'Unknown',
      companyStatus: 'unknown'
    };
  }
}

function extractCompanyNameFromDomain(domain: string): string {
  // Extract domain name without TLD
  // Example: "acme-widgets.co.uk" -> "Acme Widgets"
  const domainName = domain.split('.')[0] || 'Company';
  return domainName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function searchCompaniesHouse(companyName: string): Promise<any> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

  if (!apiKey) {
    console.warn('COMPANIES_HOUSE_API_KEY not set');
    return null;
  }

  try {
    const response = await fetch(
      `${COMPANIES_HOUSE_API_BASE}/search/companies?q=${encodeURIComponent(companyName)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': apiKey,
          'User-Agent': 'AIQuoteBot/1.0'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.items?.[0]; // Return best match
  } catch (error) {
    console.error('Companies House API error:', error);
    return null;
  }
}

function parseCompaniesHouseData(company: any): CompanyData {
  // Extract the most recent accounts data
  const lastAccounts = company.accounts?.latest_accounts;

  return {
    name: company.company_name,
    registrationNumber: company.company_number,
    revenue:
      lastAccounts?.turnover ||
      (company.accounts?.last_accounts?.turnover as number | undefined),
    employeeCount:
      lastAccounts?.employee_count ||
      (company.accounts?.last_accounts?.average_number_employees as
        | number
        | undefined),
    industry: getSICDescription(company.sic_codes?.[0]),
    foundedYear: new Date(company.date_of_creation).getFullYear(),
    location: company.registered_office_address?.locality,
    companyStatus: company.company_status === 'active' ? 'active' : 'dissolved'
  };
}

function getSICDescription(sicCode: string | undefined): string | undefined {
  if (!sicCode) return undefined;

  // Map common SIC codes to industries
  const sicMap: Record<string, string> = {
    '4791': 'E-commerce',
    '4799': 'Retail',
    '4711': 'Supermarkets',
    '5829': 'Software',
    '6201': 'IT Services',
    '6311': 'Data Processing',
    '7311': 'Advertising',
    '8211': 'Combined Office',
    '5511': 'Hotels',
    '5610': 'Restaurants'
  };

  return sicMap[sicCode.substring(0, 4)] || 'Other Services';
}
