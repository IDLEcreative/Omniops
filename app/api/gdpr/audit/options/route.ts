import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 },
      );
    }

    // Fetch unique domains from both audit log and customer configs
    const [{ data: auditDomains, error: auditDomainError }, { data: configDomains, error: configError }] =
      await Promise.all([
        supabase
          .from('gdpr_audit_log')
          .select('domain')
          .not('domain', 'is', null)
          .order('domain', { ascending: true }),
        supabase
          .from('customer_configs')
          .select('domain')
          .not('domain', 'is', null)
          .order('domain', { ascending: true }),
      ]);

    if (auditDomainError) throw auditDomainError;
    if (configError) throw configError;

    const domainSet = new Set<string>();
    for (const row of [...(auditDomains ?? []), ...(configDomains ?? [])]) {
      const domain = (row as { domain?: string | null }).domain?.trim();
      if (domain) {
        domainSet.add(domain);
      }
    }

    const { data: actorsData, error: actorsError } = await supabase
      .from('gdpr_audit_log')
      .select('actor')
      .not('actor', 'is', null)
      .order('actor', { ascending: true });

    if (actorsError) throw actorsError;

    const actors = (actorsData ?? [])
      .map((row) => (row as { actor?: string | null }).actor?.trim())
      .filter((actor): actor is string => Boolean(actor))
      .filter((actor, index, list) => list.indexOf(actor) === index)
      .sort((a, b) => a.localeCompare(b));

    const domains = Array.from(domainSet).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ domains, actors });
  } catch (error) {
    console.error('GDPR audit options error:', error);
    return NextResponse.json(
      { error: 'Failed to load audit options' },
      { status: 500 },
    );
  }
}
