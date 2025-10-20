-- Automate pruning of stale GDPR audit log entries to enforce 2-year retention

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.prune_gdpr_audit_log(p_retention INTERVAL DEFAULT INTERVAL '2 years')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_deleted INTEGER := 0;
BEGIN
  IF p_retention <= INTERVAL '0 seconds' THEN
    RAISE EXCEPTION 'Retention interval must be positive';
  END IF;

  v_cutoff := NOW() - p_retention;

  DELETE FROM public.gdpr_audit_log
  WHERE created_at < v_cutoff;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.prune_gdpr_audit_log(INTERVAL) IS
'Deletes GDPR audit log records older than the supplied retention window (default: 2 years).';

GRANT EXECUTE ON FUNCTION public.prune_gdpr_audit_log(INTERVAL) TO service_role;

DO $$
DECLARE
  v_job RECORD;
BEGIN
  FOR v_job IN SELECT jobid FROM cron.job WHERE jobname = 'prune-gdpr-audit-log'
  LOOP
    PERFORM cron.unschedule(v_job.jobid);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'prune-gdpr-audit-log',
  '15 3 * * 0',
  $$SELECT public.prune_gdpr_audit_log()$$
);
