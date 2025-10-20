-- Create training_data table for manual knowledge base management
-- Allows admins to add custom training materials that can't be scraped

CREATE TABLE IF NOT EXISTS public.training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('faq', 'product', 'policy', 'guide', 'custom')),
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  embedding_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_training_data_domain ON public.training_data(domain);
CREATE INDEX idx_training_data_status ON public.training_data(status);
CREATE INDEX idx_training_data_user_id ON public.training_data(user_id);
CREATE INDEX idx_training_data_created_at ON public.training_data(created_at DESC);

-- RLS policies
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;

-- Users can only see their own training data
CREATE POLICY "Users can view own training data" ON public.training_data
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create training data
CREATE POLICY "Users can create training data" ON public.training_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending training data
CREATE POLICY "Users can update own pending training data" ON public.training_data
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Service role has full access
CREATE POLICY "Service role has full access" ON public.training_data
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_training_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_training_data_updated_at
  BEFORE UPDATE ON public.training_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_training_data_updated_at();

COMMENT ON TABLE public.training_data IS 'Stores manually submitted training materials for AI knowledge base enhancement';
COMMENT ON COLUMN public.training_data.type IS 'Category of training data (faq, product, policy, guide, custom)';
COMMENT ON COLUMN public.training_data.status IS 'Processing status (pending, processing, completed, failed)';
COMMENT ON COLUMN public.training_data.embedding_count IS 'Number of embeddings generated from this training data';