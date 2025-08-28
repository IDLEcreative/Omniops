-- Create order_modifications_log table for auditing order modification attempts
CREATE TABLE IF NOT EXISTS order_modifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    domain TEXT NOT NULL,
    order_id INTEGER NOT NULL,
    customer_email TEXT NOT NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    modification_type TEXT NOT NULL CHECK (modification_type IN ('cancel', 'update_address', 'add_note', 'request_refund')),
    status TEXT NOT NULL CHECK (status IN ('attempted', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB,
    
    -- Indexes for performance
    INDEX idx_order_modifications_domain (domain),
    INDEX idx_order_modifications_order_id (order_id),
    INDEX idx_order_modifications_conversation (conversation_id),
    INDEX idx_order_modifications_created_at (created_at)
);

-- Add RLS policies
ALTER TABLE order_modifications_log ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access only (audit logs should not be publicly accessible)
CREATE POLICY "Service role can manage order modifications log" 
    ON order_modifications_log 
    FOR ALL 
    TO service_role
    USING (true);

-- Add comment to table
COMMENT ON TABLE order_modifications_log IS 'Audit log for all order modification attempts through the chat interface';
COMMENT ON COLUMN order_modifications_log.modification_type IS 'Type of modification attempted: cancel, update_address, add_note, request_refund';
COMMENT ON COLUMN order_modifications_log.status IS 'Status of the modification attempt: attempted, completed, failed';
COMMENT ON COLUMN order_modifications_log.metadata IS 'Additional data about the modification including request details and timestamps';