-- Add auth_user_id to customers table to link with Supabase Auth
ALTER TABLE customers 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_customers_auth_user_id ON customers(auth_user_id);

-- Create a function to automatically create a customer record when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.customers (name, email, auth_user_id, created_at, updated_at)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.id,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers table
CREATE POLICY "Users can view own customer record" ON customers
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own customer record" ON customers
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Create RLS policies for knowledge_base table
CREATE POLICY "Users can view own knowledge base" ON knowledge_base
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into own knowledge base" ON knowledge_base
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own knowledge base" ON knowledge_base
  FOR UPDATE USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete from own knowledge base" ON knowledge_base
  FOR DELETE USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for conversations table
CREATE POLICY "Users can view conversations for their customers" ON conversations
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for messages table (read-only for security)
CREATE POLICY "Users can view messages for their customers" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN customers cust ON c.customer_id = cust.id
      WHERE c.id = messages.conversation_id
      AND cust.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for embeddings table
CREATE POLICY "Users can view embeddings for their customers" ON embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM knowledge_base kb
      JOIN customers c ON kb.customer_id = c.id
      WHERE kb.id = embeddings.knowledge_base_id
      AND c.auth_user_id = auth.uid()
    )
  );

-- Note: Service role key will bypass RLS for API operations
-- This allows the backend to perform operations on behalf of users