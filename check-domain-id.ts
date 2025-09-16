import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Get domain_id for thompsonsltd.com
  const { data: domain, error: domainError } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .eq('domain', 'thompsonsltd.com')
    .single();

  console.log('Domain lookup result:', domain, domainError);

  if (!domain) {
    console.log('No domain found for thompsonsltd.com');
    process.exit(1);
  }

  const domainId = domain.id;
  console.log('Domain ID for thompsonsltd.com:', domainId);

  // Check scraped pages count
  const { count } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', domainId);

  console.log('Total scraped pages:', count);

  // Check sample pages
  const { data: samplePages } = await supabase
    .from('scraped_pages')
    .select('id, url, title, created_at')
    .eq('domain_id', domainId)
    .limit(5);

  console.log('Sample pages:', samplePages);
}

main().catch(console.error);