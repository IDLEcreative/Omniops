-- Telemetry Cleanup Function
--
-- Creates a PostgreSQL function to clean up old telemetry data from lookup_failures table.
-- Can be called manually or scheduled via cron job.
--
-- Usage:
--   SELECT cleanup_old_telemetry(90);  -- Delete records older than 90 days
--   SELECT cleanup_old_telemetry();    -- Use default 90 days
--
-- Returns:
--   INTEGER - Number of records deleted
--
-- Security:
--   SECURITY DEFINER - Runs with creator's privileges
--   Only accessible to service_role

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS cleanup_old_telemetry(INTEGER);

-- Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_telemetry(
  retention_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  deleted_count INTEGER,
  oldest_deleted TIMESTAMPTZ,
  newest_deleted TIMESTAMPTZ,
  execution_time_ms INTEGER
) AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  cutoff_date TIMESTAMPTZ;
  v_deleted_count INTEGER := 0;
  v_oldest_deleted TIMESTAMPTZ;
  v_newest_deleted TIMESTAMPTZ;
  v_execution_time_ms INTEGER;
BEGIN
  start_time := clock_timestamp();

  -- Calculate cutoff date
  cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;

  -- Log the operation (optional - can be removed if logging not needed)
  RAISE NOTICE 'Cleaning up telemetry data older than % (cutoff: %)',
    retention_days || ' days',
    cutoff_date;

  -- Get timestamp range of records to be deleted (for reporting)
  SELECT
    MIN(timestamp),
    MAX(timestamp)
  INTO
    v_oldest_deleted,
    v_newest_deleted
  FROM lookup_failures
  WHERE timestamp < cutoff_date;

  -- Perform the deletion
  DELETE FROM lookup_failures
  WHERE timestamp < cutoff_date;

  -- Get the count of deleted records
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  end_time := clock_timestamp();
  v_execution_time_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;

  RAISE NOTICE 'Deleted % records in % ms', v_deleted_count, v_execution_time_ms;

  -- Return results
  RETURN QUERY SELECT
    v_deleted_count,
    v_oldest_deleted,
    v_newest_deleted,
    v_execution_time_ms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION cleanup_old_telemetry(INTEGER) IS
  'Deletes lookup_failures records older than specified retention period. Returns count of deleted records and execution metrics.';

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION cleanup_old_telemetry(INTEGER) TO service_role;

-- Revoke from other roles for security
REVOKE EXECUTE ON FUNCTION cleanup_old_telemetry(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cleanup_old_telemetry(INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION cleanup_old_telemetry(INTEGER) FROM authenticated;

-- Create a helper view to check telemetry stats
CREATE OR REPLACE VIEW telemetry_stats AS
SELECT
  COUNT(*) as total_records,
  MIN(timestamp) as oldest_record,
  MAX(timestamp) as newest_record,
  COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days') as records_last_7_days,
  COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '30 days') as records_last_30_days,
  COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '90 days') as records_last_90_days,
  COUNT(*) FILTER (WHERE timestamp < NOW() - INTERVAL '90 days') as records_older_90_days,
  pg_size_pretty(pg_total_relation_size('lookup_failures')) as table_size,
  pg_total_relation_size('lookup_failures') as table_size_bytes
FROM lookup_failures;

COMMENT ON VIEW telemetry_stats IS
  'Provides overview statistics for lookup_failures table including record counts by age and storage size.';

-- Grant select on view to service role
GRANT SELECT ON telemetry_stats TO service_role;
