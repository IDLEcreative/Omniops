-- GDPR audit log to capture export/deletion requests initiated from the dashboard

CREATE TABLE IF NOT EXISTS public.gdpr_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
  session_id TEXT,
  email TEXT,
  actor TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  deleted_count INTEGER,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gdpr_audit_log IS 'Tracks GDPR export/delete requests for compliance auditing.';
COMMENT ON COLUMN public.gdpr_audit_log.request_type IS 'Type of GDPR request (export/delete).';
COMMENT ON COLUMN public.gdpr_audit_log.actor IS 'Dashboard user initiating the request.';

CREATE INDEX IF NOT EXISTS idx_gdpr_audit_domain_created ON public.gdpr_audit_log(domain, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_request_type ON public.gdpr_audit_log(request_type);
