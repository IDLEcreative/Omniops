interface OptimizationStep {
  name: string;
  sql: string;
}

export const optimizationSteps: OptimizationStep[] = [
  {
    name: 'Remove duplicate index on page_embeddings',
    sql: `DROP INDEX IF EXISTS idx_page_embeddings_page;`
  },
  {
    name: 'Fix scrape_jobs RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view their own scrape jobs" ON scrape_jobs;
      DROP POLICY IF EXISTS "Users can manage their own scrape jobs" ON scrape_jobs;
      
      CREATE POLICY "Users can access their own scrape jobs" ON scrape_jobs
        FOR ALL
        USING (
          domain_id IN (
            SELECT id FROM domains 
            WHERE user_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix scraped_pages RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view their domain's pages" ON scraped_pages;
      DROP POLICY IF EXISTS "Users can insert pages for their domains" ON scraped_pages;
      
      CREATE POLICY "Users can access their domain pages" ON scraped_pages
        FOR ALL
        USING (
          domain_id IN (
            SELECT id FROM domains 
            WHERE user_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix domains RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view their own domains" ON domains;
      DROP POLICY IF EXISTS "Users can insert their own domains" ON domains;
      DROP POLICY IF EXISTS "Users can update their own domains" ON domains;
      DROP POLICY IF EXISTS "Users can delete their own domains" ON domains;
      
      CREATE POLICY "Users own domains" ON domains
        FOR ALL
        USING (user_id = (SELECT auth.uid()));
    `
  },
  {
    name: 'Fix website_content RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view their domain's content" ON website_content;
      DROP POLICY IF EXISTS "Users can insert content for their domains" ON website_content;
      
      CREATE POLICY "Users can access their domain content" ON website_content
        FOR ALL
        USING (
          domain_id IN (
            SELECT id FROM domains 
            WHERE user_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix structured_extractions RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view their domain's extractions" ON structured_extractions;
      DROP POLICY IF EXISTS "Users can insert extractions for their domains" ON structured_extractions;
      
      CREATE POLICY "Users can access their domain extractions" ON structured_extractions
        FOR ALL
        USING (
          domain_id IN (
            SELECT id FROM domains 
            WHERE user_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix businesses RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Business owners see own data" ON businesses;
      DROP POLICY IF EXISTS "Service role has full access to businesses" ON businesses;
      
      CREATE POLICY "Business access control" ON businesses
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role' 
          OR owner_id = (SELECT auth.uid())
        );
    `
  },
  {
    name: 'Fix business_configs RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Business configs isolated" ON business_configs;
      DROP POLICY IF EXISTS "Service role has full access to configs" ON business_configs;
      
      CREATE POLICY "Business configs access control" ON business_configs
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix business_usage RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Business usage isolated" ON business_usage;
      DROP POLICY IF EXISTS "Service role has full access to usage" ON business_usage;
      
      CREATE POLICY "Business usage access control" ON business_usage
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix customer_verifications RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Verifications isolated by business" ON customer_verifications;
      DROP POLICY IF EXISTS "Service role has full access to verifications" ON customer_verifications;
      
      CREATE POLICY "Customer verifications access control" ON customer_verifications
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix customer_access_logs RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Access logs isolated by business" ON customer_access_logs;
      DROP POLICY IF EXISTS "Service role has full access to access logs" ON customer_access_logs;
      
      CREATE POLICY "Customer access logs control" ON customer_access_logs
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix customer_data_cache RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Cache isolated by business" ON customer_data_cache;
      DROP POLICY IF EXISTS "Service role has full access to cache" ON customer_data_cache;
      
      CREATE POLICY "Customer cache access control" ON customer_data_cache
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Create helper function for user business IDs',
    sql: `
      CREATE OR REPLACE FUNCTION get_user_business_ids()
      RETURNS SETOF uuid
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public, pg_catalog
      AS $$
        SELECT id 
        FROM businesses 
        WHERE owner_id = (SELECT auth.uid())
      $$;
      
      GRANT EXECUTE ON FUNCTION get_user_business_ids TO authenticated;
    `
  },
  {
    name: 'Create helper function for user domain IDs',
    sql: `
      CREATE OR REPLACE FUNCTION get_user_domain_ids()
      RETURNS SETOF uuid
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public, pg_catalog
      AS $$
        SELECT id 
        FROM domains 
        WHERE user_id = (SELECT auth.uid())
      $$;
      
      GRANT EXECUTE ON FUNCTION get_user_domain_ids TO authenticated;
    `
  },
  {
    name: 'Optimize policies with helper functions',
    sql: `
      DROP POLICY IF EXISTS "Business configs access control" ON business_configs;
      CREATE POLICY "Business configs access control" ON business_configs
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (SELECT get_user_business_ids())
        );
      
      DROP POLICY IF EXISTS "Users can access their domain pages" ON scraped_pages;
      CREATE POLICY "Users can access their domain pages" ON scraped_pages
        FOR ALL
        USING (
          domain_id IN (SELECT get_user_domain_ids())
        );
      
      DROP POLICY IF EXISTS "Users can access their domain content" ON website_content;
      CREATE POLICY "Users can access their domain content" ON website_content
        FOR ALL
        USING (
          domain_id IN (SELECT get_user_domain_ids())
        );
      
      DROP POLICY IF EXISTS "Users can access their own scrape jobs" ON scrape_jobs;
      CREATE POLICY "Users can access their own scrape jobs" ON scrape_jobs
        FOR ALL
        USING (
          domain_id IN (SELECT get_user_domain_ids())
        );
    `
  },
  {
    name: 'Set service role to bypass RLS',
    sql: `ALTER ROLE service_role SET row_security TO off;`
  },
  {
    name: 'Analyze tables for query planner',
    sql: `
      ANALYZE businesses;
      ANALYZE business_configs;
      ANALYZE business_usage;
      ANALYZE customer_verifications;
      ANALYZE customer_access_logs;
      ANALYZE customer_data_cache;
      ANALYZE domains;
      ANALYZE scraped_pages;
      ANALYZE website_content;
      ANALYZE structured_extractions;
      ANALYZE scrape_jobs;
    `
  }
];
