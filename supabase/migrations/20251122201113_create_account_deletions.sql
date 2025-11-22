-- Account deletion requests table (30-day cooling off period)
-- GDPR Article 17: Right to Erasure

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  requested_at timestamptz DEFAULT now() NOT NULL,
  scheduled_for timestamptz NOT NULL,  -- 30 days from request
  reason text,
  ip_address inet,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  cancelled_at timestamptz,
  completed_at timestamptz,
  cancellation_reason text
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_deletions_user_id ON public.account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletions_scheduled ON public.account_deletion_requests(scheduled_for)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_account_deletions_status ON public.account_deletion_requests(status);

-- Row Level Security
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own deletion requests
CREATE POLICY "Users can view own deletion requests"
  ON public.account_deletion_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own deletion requests
CREATE POLICY "Users can insert own deletion requests"
  ON public.account_deletion_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own deletion requests (to cancel)
CREATE POLICY "Users can cancel own deletion requests"
  ON public.account_deletion_requests
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Service role can view and update all deletion requests (for processing)
CREATE POLICY "Service role can manage deletion requests"
  ON public.account_deletion_requests
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comments for documentation
COMMENT ON TABLE public.account_deletion_requests IS 'GDPR Article 17 - Right to Erasure with 30-day cooling off period';
COMMENT ON COLUMN public.account_deletion_requests.scheduled_for IS 'Actual deletion date (30 days after request) - allows user to cancel';
COMMENT ON COLUMN public.account_deletion_requests.status IS 'pending: awaiting deletion, cancelled: user cancelled, completed: deletion executed';
COMMENT ON COLUMN public.account_deletion_requests.reason IS 'Optional reason provided by user for deletion request';
COMMENT ON COLUMN public.account_deletion_requests.cancellation_reason IS 'Reason provided if user cancels the deletion request';
