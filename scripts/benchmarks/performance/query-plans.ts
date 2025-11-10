import { executeSQL, getSupabaseConfig } from '../../supabase-config.js';
import { TEST_DOMAIN } from './config';

const config = getSupabaseConfig();

const PLAN_QUERIES = [
  {
    name: 'Embedding Search',
    sql: `EXPLAIN (ANALYZE, BUFFERS) 
          SELECT * FROM page_embeddings 
          WHERE domain_id = '${TEST_DOMAIN}' 
          ORDER BY embedding <-> '[0.1,0.2,0.3]' 
          LIMIT 5;`
  },
  {
    name: 'Content Search',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT * FROM scraped_pages
          WHERE domain = '${TEST_DOMAIN}'
          AND content_search_vector @@ plainto_tsquery('english', 'test')
          LIMIT 10;`
  }
];

export async function analyzeQueryPlans() {
  console.log('\n📊 Analyzing Query Execution Plans...');

  for (const query of PLAN_QUERIES) {
    try {
      const result = await executeSQL(config, query.sql);
      const plan = JSON.stringify(result);
      const execTime = plan.match(/Execution Time: ([\d.]+)/i)?.[1];

      console.log(`\n  ${query.name}:`);
      console.log(`    Execution time: ${execTime || 'N/A'}ms`);
      console.log(plan.includes('Seq Scan') ? '    ⚠️  Sequential scan detected' : '    ✅ Using index scan');
    } catch (error: any) {
      console.log(`  ${query.name}: Error - ${error.message}`);
    }
  }
}
