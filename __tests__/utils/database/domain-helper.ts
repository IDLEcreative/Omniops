/**
 * Domain Helper
 * Utilities for domain lookups and validation
 */

export async function getDomainId(supabase: any, domain: string): Promise<string> {
  const { data: domainData } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domain)
    .single();

  if (!domainData) {
    throw new Error(`Domain "${domain}" not found in database`);
  }

  return domainData.id;
}

export async function resetDomainTimestamps(supabase: any, domainId: string): Promise<void> {
  await supabase
    .from('domains')
    .update({
      last_scraped_at: null,
      last_content_refresh: null
    })
    .eq('id', domainId);
}
