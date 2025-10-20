-- Enable row level security and policies for gdpr_audit_log

ALTER TABLE public.gdpr_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages GDPR audit log" ON public.gdpr_audit_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
