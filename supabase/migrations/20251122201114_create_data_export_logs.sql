-- Track data export requests for GDPR compliance
-- GDPR Article 15: Right of Access
-- GDPR Article 20: Right to Data Portability

CREATE TABLE IF NOT EXISTS public.data_export_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  file_size_bytes bigint,
  records_exported jsonb,  -- {"conversations": 10, "messages": 50, "scraped_pages": 5, etc.}
  ip_address inet,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message text,
  export_format text DEFAULT 'json' CHECK (export_format IN ('json', 'csv'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_export_logs_user_id ON public.data_export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_logs_requested_at ON public.data_export_logs(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_export_logs_status ON public.data_export_logs(status);

-- Row Level Security
ALTER TABLE public.data_export_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own export logs
CREATE POLICY "Users can view own export logs"
  ON public.data_export_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own export requests
CREATE POLICY "Users can insert own export requests"
  ON public.data_export_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all export logs (for processing)
CREATE POLICY "Service role can manage export logs"
  ON public.data_export_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comments for documentation
COMMENT ON TABLE public.data_export_logs IS 'GDPR Article 15 & 20 - Right of Access and Data Portability audit trail';
COMMENT ON COLUMN public.data_export_logs.records_exported IS 'JSON object with count of records exported per table (e.g., {"conversations": 10, "messages": 50})';
COMMENT ON COLUMN public.data_export_logs.status IS 'processing: export in progress, completed: export ready, failed: export failed';
COMMENT ON COLUMN public.data_export_logs.error_message IS 'Error details if export failed';
COMMENT ON COLUMN public.data_export_logs.export_format IS 'Format of the export file (json or csv)';
COMMENT ON COLUMN public.data_export_logs.file_size_bytes IS 'Size of the generated export file in bytes';
