-- Create feedback table for user feedback collection
-- Supports satisfaction ratings, NPS, bug reports, and feature requests

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Feedback classification
  type TEXT NOT NULL CHECK (type IN ('satisfaction', 'bug', 'feature_request', 'general', 'nps')),
  category TEXT,
  sentiment TEXT CHECK (sentiment IN ('negative', 'neutral', 'positive')),
  is_urgent BOOLEAN DEFAULT FALSE,

  -- Ratings and scores
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),

  -- Feedback content
  message TEXT,

  -- Context
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  session_id TEXT,
  domain TEXT,
  user_agent TEXT,
  url TEXT,

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_feedback_domain ON feedback(domain);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_is_urgent ON feedback(is_urgent) WHERE is_urgent = TRUE;
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_conversation_id ON feedback(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id) WHERE session_id IS NOT NULL;

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_feedback_domain_type ON feedback(domain, type);
CREATE INDEX IF NOT EXISTS idx_feedback_domain_created_at ON feedback(domain, created_at DESC);

-- GIN index for metadata search
CREATE INDEX IF NOT EXISTS idx_feedback_metadata ON feedback USING gin(metadata);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to insert feedback (anonymous submissions)
CREATE POLICY "Allow public feedback submission"
  ON feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to read their own domain's feedback
CREATE POLICY "Allow domain owners to read feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    domain IN (
      SELECT domain FROM customer_configs
      WHERE org_id IN (
        SELECT org_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Allow admins to read all feedback
CREATE POLICY "Allow admins to read all feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Comments for documentation
COMMENT ON TABLE feedback IS 'User feedback collection including ratings, NPS, bug reports, and feature requests';
COMMENT ON COLUMN feedback.type IS 'Type of feedback: satisfaction, bug, feature_request, general, nps';
COMMENT ON COLUMN feedback.sentiment IS 'Auto-calculated sentiment based on rating: negative (1-2), neutral (3), positive (4-5)';
COMMENT ON COLUMN feedback.is_urgent IS 'Flag for urgent feedback requiring immediate attention';
COMMENT ON COLUMN feedback.rating IS 'Satisfaction rating from 1 (very unsatisfied) to 5 (very satisfied)';
COMMENT ON COLUMN feedback.nps_score IS 'Net Promoter Score from 0 (not likely) to 10 (very likely)';
