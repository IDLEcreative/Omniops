-- User agreements table for Terms of Service acceptance
-- GDPR Article 7: Conditions for consent

CREATE TABLE IF NOT EXISTS public.user_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  terms_version text NOT NULL,  -- e.g., "2025-11-19"
  accepted_at timestamptz DEFAULT now() NOT NULL,
  ip_address inet,
  user_agent text,
  UNIQUE(user_id, terms_version)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_id ON public.user_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agreements_accepted_at ON public.user_agreements(accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_agreements_terms_version ON public.user_agreements(terms_version);

-- Row Level Security
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

-- Users can view their own agreements
CREATE POLICY "Users can view own agreements"
  ON public.user_agreements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own agreements
CREATE POLICY "Users can insert own agreements"
  ON public.user_agreements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can view all agreements (for admin/compliance)
CREATE POLICY "Service role can view all agreements"
  ON public.user_agreements
  FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');

-- Comments for documentation
COMMENT ON TABLE public.user_agreements IS 'Tracks user acceptance of Terms of Service for legal compliance (GDPR Article 7)';
COMMENT ON COLUMN public.user_agreements.terms_version IS 'Version identifier for Terms (typically date in YYYY-MM-DD format)';
COMMENT ON COLUMN public.user_agreements.ip_address IS 'IP address at time of acceptance for legal proof';
COMMENT ON COLUMN public.user_agreements.user_agent IS 'Browser user agent at time of acceptance for additional proof';
COMMENT ON COLUMN public.user_agreements.accepted_at IS 'Timestamp when user accepted this version of terms';
