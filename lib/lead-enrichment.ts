/**
 * Lead Enrichment Service
 * Automatically finds contact emails for demo leads using web search
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EnrichmentResult {
  email: string | null;
  source: string | null;
  status: 'enriched' | 'failed';
}

/**
 * Enriches a lead by finding contact email via web search
 */
export async function enrichLead(domain: string, url: string): Promise<EnrichmentResult> {
  try {
    console.log(`[Lead Enrichment] Starting for domain: ${domain}`);

    // Strategy 1: Check common contact pages
    const contactEmail = await findEmailFromContactPages(domain);
    if (contactEmail) {
      console.log(`[Lead Enrichment] Found email on contact page: ${contactEmail}`);
      return {
        email: contactEmail.email,
        source: contactEmail.source,
        status: 'enriched'
      };
    }

    // Strategy 2: Web search for email
    const searchEmail = await findEmailViaWebSearch(domain);
    if (searchEmail) {
      console.log(`[Lead Enrichment] Found email via web search: ${searchEmail}`);
      return {
        email: searchEmail.email,
        source: searchEmail.source,
        status: 'enriched'
      };
    }

    console.log(`[Lead Enrichment] No email found for: ${domain}`);
    return {
      email: null,
      source: null,
      status: 'failed'
    };

  } catch (error) {
    console.error(`[Lead Enrichment] Error for ${domain}:`, error);
    return {
      email: null,
      source: null,
      status: 'failed'
    };
  }
}

/**
 * Attempts to find email from common contact pages
 */
async function findEmailFromContactPages(domain: string): Promise<{ email: string; source: string } | null> {
  const contactPaths = ['/contact', '/contact-us', '/about', '/about-us'];

  for (const path of contactPaths) {
    try {
      const url = `https://${domain}${path}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadBot/1.0)' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const html = await response.text();
        const email = extractEmailFromHTML(html);

        if (email) {
          return { email, source: url };
        }
      }
    } catch (error) {
      // Continue to next path
      continue;
    }
  }

  return null;
}

/**
 * Uses web search to find contact email
 */
async function findEmailViaWebSearch(domain: string): Promise<{ email: string; source: string } | null> {
  try {
    // Search for contact email using web search
    const searchQuery = `${domain} contact email`;

    // This would use WebSearch API in production
    // For now, we'll try to scrape the main domain
    const response = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadBot/1.0)' },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const html = await response.text();
      const email = extractEmailFromHTML(html);

      if (email) {
        return { email, source: `https://${domain}` };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts email addresses from HTML content
 */
function extractEmailFromHTML(html: string): string | null {
  // Common email patterns
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = html.match(emailRegex);

  if (!matches || matches.length === 0) {
    return null;
  }

  // Filter out common non-contact emails
  const excludePatterns = [
    'example.com',
    'test.com',
    'domain.com',
    'email.com',
    'noreply',
    'no-reply',
    'webmaster',
    'postmaster'
  ];

  const validEmails = matches.filter(email => {
    const lowerEmail = email.toLowerCase();
    return !excludePatterns.some(pattern => lowerEmail.includes(pattern));
  });

  // Prioritize common contact emails
  const priorityPrefixes = ['contact', 'info', 'hello', 'support', 'sales'];
  const priorityEmail = validEmails.find(email => {
    const lowerEmail = email.toLowerCase();
    return priorityPrefixes.some(prefix => lowerEmail.startsWith(prefix));
  });

  return priorityEmail || validEmails[0] || null;
}

/**
 * Background job to enrich pending leads
 */
export async function enrichPendingLeads() {
  try {
    console.log('[Lead Enrichment] Starting batch enrichment...');

    // Get pending leads (limit to 10 at a time to avoid rate limits)
    const { data: pendingLeads, error } = await supabase
      .from('demo_attempts')
      .select('id, domain, url')
      .eq('enrichment_status', 'pending')
      .is('contact_email', null)
      .limit(10);

    if (error) {
      console.error('[Lead Enrichment] Error fetching pending leads:', error);
      return;
    }

    if (!pendingLeads || pendingLeads.length === 0) {
      console.log('[Lead Enrichment] No pending leads to enrich');
      return;
    }

    console.log(`[Lead Enrichment] Enriching ${pendingLeads.length} leads...`);

    // Enrich each lead
    for (const lead of pendingLeads) {
      const result = await enrichLead(lead.domain, lead.url);

      // Update the record
      await supabase
        .from('demo_attempts')
        .update({
          contact_email: result.email,
          email_source: result.source,
          enrichment_status: result.status,
          enriched_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('[Lead Enrichment] Batch enrichment completed');

  } catch (error) {
    console.error('[Lead Enrichment] Batch enrichment error:', error);
  }
}
