-- =====================================================================
-- CREATE exec_sql FUNCTION FOR EXECUTING RAW SQL
-- Apply this FIRST in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new
-- =====================================================================
-- This function allows the service role to execute raw SQL statements
-- Required for programmatic migration execution
-- =====================================================================

-- Create function to execute raw SQL (only accessible to service_role)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Only allow service_role to execute this function
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

COMMENT ON FUNCTION exec_sql(text) IS
'Execute raw SQL - only accessible to service_role for migrations and administrative tasks';
