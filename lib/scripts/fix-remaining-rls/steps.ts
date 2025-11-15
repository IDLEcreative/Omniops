/**
 * RLS Fix Steps - SQL statements for fixing RLS policies
 */

export interface FixStep {
  name: string;
  sql: string;
  isCheck?: boolean;
}

export const fixSteps: FixStep[] = [
  {
    name: 'Check existing business policies',
    sql: `
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'businesses';
    `,
    isCheck: true
  },
  {
    name: 'Drop all existing business policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN
          SELECT policyname
          FROM pg_policies
          WHERE schemaname = 'public'
          AND tablename = 'businesses'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON businesses', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized businesses policy',
    sql: `
      CREATE POLICY "Business access control" ON businesses
        FOR ALL
        USING (
          CASE
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
            THEN true
            ELSE owner_id = (SELECT auth.uid())
          END
        );
    `
  },
  {
    name: 'Drop all business_configs policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN
          SELECT policyname
          FROM pg_policies
          WHERE schemaname = 'public'
          AND tablename = 'business_configs'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON business_configs', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized business_configs policy',
    sql: `
      CREATE POLICY "Business configs access control" ON business_configs
        FOR ALL
        USING (
          CASE
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
            THEN true
            ELSE business_id IN (
              SELECT id FROM businesses
              WHERE owner_id = (SELECT auth.uid())
            )
          END
        );
    `
  },
  {
    name: 'Drop all business_usage policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN
          SELECT policyname
          FROM pg_policies
          WHERE schemaname = 'public'
          AND tablename = 'business_usage'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON business_usage', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized business_usage policy',
    sql: `
      CREATE POLICY "Business usage access control" ON business_usage
        FOR ALL
        USING (
          CASE
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
            THEN true
            ELSE business_id IN (
              SELECT id FROM businesses
              WHERE owner_id = (SELECT auth.uid())
            )
          END
        );
    `
  },
  {
    name: 'Drop all customer_verifications policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN
          SELECT policyname
          FROM pg_policies
          WHERE schemaname = 'public'
          AND tablename = 'customer_verifications'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON customer_verifications', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized customer_verifications policy',
    sql: `
      CREATE POLICY "Customer verifications access control" ON customer_verifications
        FOR ALL
        USING (
          CASE
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
            THEN true
            ELSE business_id IN (
              SELECT id FROM businesses
              WHERE owner_id = (SELECT auth.uid())
            )
          END
        );
    `
  },
  {
    name: 'Drop all customer_access_logs policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN
          SELECT policyname
          FROM pg_policies
          WHERE schemaname = 'public'
          AND tablename = 'customer_access_logs'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON customer_access_logs', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized customer_access_logs policy',
    sql: `
      CREATE POLICY "Customer access logs control" ON customer_access_logs
        FOR ALL
        USING (
          CASE
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
            THEN true
            ELSE business_id IN (
              SELECT id FROM businesses
              WHERE owner_id = (SELECT auth.uid())
            )
          END
        );
    `
  },
  {
    name: 'Drop all customer_data_cache policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN
          SELECT policyname
          FROM pg_policies
          WHERE schemaname = 'public'
          AND tablename = 'customer_data_cache'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON customer_data_cache', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized customer_data_cache policy',
    sql: `
      CREATE POLICY "Customer cache access control" ON customer_data_cache
        FOR ALL
        USING (
          CASE
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
            THEN true
            ELSE business_id IN (
              SELECT id FROM businesses
              WHERE owner_id = (SELECT auth.uid())
            )
          END
        );
    `
  },
  {
    name: 'Create user_business_ids helper function',
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
    name: 'Final verification of RLS optimization',
    sql: `
      SELECT
        tablename,
        COUNT(*) as policy_count,
        BOOL_OR(qual LIKE '%(SELECT auth.uid())%') as has_optimized_auth
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN (
        'businesses', 'business_configs', 'business_usage',
        'customer_verifications', 'customer_access_logs', 'customer_data_cache'
      )
      GROUP BY tablename
      ORDER BY tablename;
    `,
    isCheck: true
  }
];
