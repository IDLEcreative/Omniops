import { Client  } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Parse Supabase connection string
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

// Construct direct database URL
const DATABASE_URL = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 40)}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;

async function applyFixes() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    const fixes = [
      {
        name: 'Critical index on page_embeddings',
        sql: 'CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id ON page_embeddings(page_id)'
      },
      {
        name: 'Unique constraint on scraped_pages',
        sql: 'ALTER TABLE scraped_pages ADD CONSTRAINT IF NOT EXISTS scraped_pages_url_unique UNIQUE (url)'
      },
      {
        name: 'Index on scraped_pages domain_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_id ON scraped_pages(domain_id)'
      },
      {
        name: 'Analyze page_embeddings',
        sql: 'ANALYZE page_embeddings'
      },
      {
        name: 'Analyze scraped_pages',
        sql: 'ANALYZE scraped_pages'
      }
    ];

    for (const fix of fixes) {
      process.stdout.write(`Applying: ${fix.name}... `);
      try {
        await client.query(fix.sql);
        console.log('✅ Success');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('✅ Already exists');
        } else {
          console.log(`❌ Error: ${err.message}`);
        }
      }
    }

    // Check status
    console.log('\n📊 Checking database status...');
    const result = await client.query(`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
        (SELECT count(*) FROM scraped_pages) as total_pages,
        (SELECT count(*) FROM page_embeddings) as total_embeddings
    `);
    
    const stats = result.rows[0];
    console.log(`✅ Active queries: ${stats.active_queries}`);
    console.log(`✅ Total pages: ${stats.total_pages}`);
    console.log(`✅ Total embeddings: ${stats.total_embeddings}`);
    
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

applyFixes().catch(console.error);