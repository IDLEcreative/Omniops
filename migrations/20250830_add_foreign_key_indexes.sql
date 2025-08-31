-- Migration: Add indexes for unindexed foreign keys
-- Date: 2025-08-30
-- Purpose: Improve JOIN performance and cascading operations

-- 1. Add index for ai_optimized_content.source_content_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_optimized_content_source_content_id 
ON public.ai_optimized_content(source_content_id);

-- 2. Add indexes for conversations foreign keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_customer_id 
ON public.conversations(customer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_domain_id 
ON public.conversations(domain_id);

-- 3. Add index for customer_configs.customer_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_configs_customer_id 
ON public.customer_configs(customer_id);

-- 4. Add index for customers.auth_user_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_auth_user_id 
ON public.customers(auth_user_id);

-- 5. Add index for domains.user_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_domains_user_id 
ON public.domains(user_id);

-- 6. Add index for messages.conversation_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id 
ON public.messages(conversation_id);

-- 7. Add indexes for training_data foreign keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_data_domain_id 
ON public.training_data(domain_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_data_user_id 
ON public.training_data(user_id);

-- Note: Using CREATE INDEX CONCURRENTLY to avoid locking tables during index creation
-- This allows the database to remain operational while indexes are being built