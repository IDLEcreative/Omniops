#!/usr/bin/env node

const https = require('https');

const PROJECT_REF = 'birugqyuqhiahxvxeyqg';
const ACCESS_TOKEN = 'sbp_3d1fa3086b18fbca507ee9b65042aa264395e1b8';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(result.error || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function fixBulkUpsert() {
  console.log('🔧 Fixing bulk_upsert_scraped_pages function...\n');
  
  // Drop the old function
  console.log('Dropping old function...');
  await executeSQL('DROP FUNCTION IF EXISTS bulk_upsert_scraped_pages(jsonb);');
  
  // Create the fixed function with proper column qualification
  console.log('Creating fixed function...');
  const createFunction = `
CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(
  pages jsonb
)
RETURNS TABLE(
  id uuid,
  url text,
  status text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO scraped_pages (
    url, title, content, domain_id, status, scraped_at, metadata
  )
  SELECT 
    (p->>'url')::text,
    (p->>'title')::text,
    (p->>'content')::text,
    (p->>'domain_id')::uuid,
    COALESCE((p->>'status')::text, 'completed'),
    COALESCE((p->>'scraped_at')::timestamptz, NOW()),
    COALESCE((p->'metadata')::jsonb, '{}'::jsonb)
  FROM jsonb_array_elements(pages) AS p
  ON CONFLICT (url) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    scraped_at = EXCLUDED.scraped_at,
    metadata = EXCLUDED.metadata,
    last_scraped_at = NOW()
  RETURNING 
    scraped_pages.id,
    scraped_pages.url,
    scraped_pages.status;
END;
$$;`;
  
  await executeSQL(createFunction);
  
  console.log('Granting permissions...');
  await executeSQL('GRANT EXECUTE ON FUNCTION bulk_upsert_scraped_pages TO service_role;');
  
  console.log('\n✅ Function fixed successfully!');
}

fixBulkUpsert().catch(console.error);