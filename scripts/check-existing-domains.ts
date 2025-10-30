import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.startsWith('#') || !line.trim()) return;
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    });
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDomains() {
  console.log('🔍 Checking existing scraped data...\n');

  // Get all customer configs with their scraped page counts
  const { data: configs, error } = await supabase
    .from('customer_configs')
    .select('id, domain, business_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('📊 Scraped data by domain:');
  console.log('─────────────────────────────────────────');

  let totalPages = 0;
  let totalEmbeddings = 0;

  for (const config of configs || []) {
    const { count: pageCount } = await supabase
      .from('scraped_pages')
      .select('id', { count: 'exact', head: true })
      .eq('domain_id', config.id);

    if ((pageCount || 0) > 0) {
      // Get page IDs for this domain
      const { data: pages } = await supabase
        .from('scraped_pages')
        .select('id')
        .eq('domain_id', config.id)
        .limit(1000);

      const pageIds = pages?.map(p => p.id) || [];

      // Count embeddings
      let embCount = 0;
      if (pageIds.length > 0) {
        const { count } = await supabase
          .from('page_embeddings')
          .select('id', { count: 'exact', head: true })
          .in('page_id', pageIds);
        embCount = count || 0;
      }

      console.log(`\n${config.domain}:`);
      console.log(`  Business: ${config.business_name || 'N/A'}`);
      console.log(`  Pages: ${pageCount}`);
      console.log(`  Embeddings: ${embCount}`);

      totalPages += (pageCount || 0);
      totalEmbeddings += embCount;
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`Total pages: ${totalPages}`);
  console.log(`Total embeddings: ${totalEmbeddings}`);
  console.log(`Domains with data: ${configs?.filter(c => c.id).length || 0}`);
}

checkDomains();
