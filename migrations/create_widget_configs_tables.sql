-- Migration: Create widget configuration tables for multi-tenant chat widget customization
-- This migration creates tables to store widget configurations and templates
-- ensuring brand-agnostic, multi-tenant support

-- Create widget_configs table
CREATE TABLE IF NOT EXISTS widget_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_config_id UUID REFERENCES customer_configs(id) ON DELETE CASCADE,

    -- Theme Settings (JSON)
    theme_settings JSONB DEFAULT '{
        "primaryColor": "#3b82f6",
        "backgroundColor": "#ffffff",
        "textColor": "#1f2937",
        "borderRadius": "8",
        "fontSize": "14",
        "fontFamily": "system-ui",
        "darkMode": false,
        "customCSS": ""
    }'::jsonb,

    -- Position and Layout Settings (JSON)
    position_settings JSONB DEFAULT '{
        "position": "bottom-right",
        "offsetX": 24,
        "offsetY": 24,
        "width": 380,
        "height": 600,
        "mobileBreakpoint": 768
    }'::jsonb,

    -- AI Behavior Settings (JSON)
    ai_settings JSONB DEFAULT '{
        "personality": "professional",
        "responseLength": "balanced",
        "confidenceThreshold": 0.7,
        "fallbackBehavior": "apologize_and_offer_help",
        "language": "auto",
        "customSystemPrompt": "",
        "enableSmartSuggestions": true,
        "maxTokens": 500,
        "temperature": 0.7
    }'::jsonb,

    -- Widget Behavior Settings (JSON)
    behavior_settings JSONB DEFAULT '{
        "welcomeMessage": "Hi! How can I help you today?",
        "placeholderText": "Type your message...",
        "botName": "Assistant",
        "avatarUrl": "",
        "showAvatar": true,
        "showTypingIndicator": true,
        "autoOpen": false,
        "openDelay": 3000,
        "minimizable": true,
        "soundNotifications": false,
        "persistConversation": true,
        "messageDelay": 500
    }'::jsonb,

    -- Integration Settings (JSON)
    integration_settings JSONB DEFAULT '{
        "enableWooCommerce": false,
        "enableWebSearch": false,
        "enableKnowledgeBase": true,
        "apiRateLimit": 60,
        "webhookUrl": "",
        "customHeaders": {},
        "allowedDomains": [],
        "dataSourcePriority": ["knowledge_base", "web_search", "woocommerce"]
    }'::jsonb,

    -- Analytics Settings (JSON)
    analytics_settings JSONB DEFAULT '{
        "trackConversations": true,
        "trackUserBehavior": true,
        "trackPerformance": true,
        "customEvents": [],
        "dataRetentionDays": 30,
        "anonymizeData": false,
        "shareAnalyticsWithCustomer": true
    }'::jsonb,

    -- Advanced Settings (JSON)
    advanced_settings JSONB DEFAULT '{
        "corsOrigins": ["*"],
        "cacheEnabled": true,
        "cacheTTL": 3600,
        "debugMode": false,
        "customJSHooks": {},
        "securityHeaders": {},
        "rateLimitOverride": null,
        "experimentalFeatures": []
    }'::jsonb,

    -- Branding Settings (JSON) - Multi-tenant support
    branding_settings JSONB DEFAULT '{
        "showPoweredBy": true,
        "customBrandingText": "",
        "customLogoUrl": "",
        "customFaviconUrl": "",
        "brandColors": {}
    }'::jsonb,

    -- Version control
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create widget_config_templates table
CREATE TABLE IF NOT EXISTS widget_config_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- e.g., 'e-commerce', 'support', 'sales', 'custom'

    -- Template configuration (combines all settings)
    config JSONB NOT NULL,

    -- Template metadata
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,

    -- Preview information
    preview_image_url TEXT,
    demo_url TEXT,

    -- Ownership
    created_by UUID REFERENCES auth.users(id),
    organization_id UUID, -- For organization-specific templates

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create widget_config_history table for version tracking
CREATE TABLE IF NOT EXISTS widget_config_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    widget_config_id UUID REFERENCES widget_configs(id) ON DELETE CASCADE,

    -- Snapshot of all settings at this version
    config_snapshot JSONB NOT NULL,
    version INTEGER NOT NULL,

    -- Change tracking
    change_description TEXT,
    changed_fields TEXT[],

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create A/B testing configurations table
CREATE TABLE IF NOT EXISTS widget_config_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    widget_config_id UUID REFERENCES widget_configs(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,

    -- Variant configuration (partial overrides)
    config_overrides JSONB NOT NULL,

    -- Testing parameters
    traffic_percentage DECIMAL(5,2) DEFAULT 50.00,
    is_active BOOLEAN DEFAULT false,

    -- Performance metrics
    metrics JSONB DEFAULT '{
        "conversations": 0,
        "satisfaction_score": 0,
        "conversion_rate": 0,
        "avg_response_time": 0
    }'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_widget_configs_customer_config_id ON widget_configs(customer_config_id);
CREATE INDEX idx_widget_configs_is_active ON widget_configs(is_active);
CREATE INDEX idx_widget_configs_version ON widget_configs(version);
CREATE INDEX idx_widget_config_templates_category ON widget_config_templates(category);
CREATE INDEX idx_widget_config_templates_is_public ON widget_config_templates(is_public);
CREATE INDEX idx_widget_config_templates_is_featured ON widget_config_templates(is_featured);
CREATE INDEX idx_widget_config_history_widget_config_id ON widget_config_history(widget_config_id);
CREATE INDEX idx_widget_config_history_version ON widget_config_history(widget_config_id, version);
CREATE INDEX idx_widget_config_variants_widget_config_id ON widget_config_variants(widget_config_id);
CREATE INDEX idx_widget_config_variants_is_active ON widget_config_variants(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_widget_configs_updated_at
    BEFORE UPDATE ON widget_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_config_templates_updated_at
    BEFORE UPDATE ON widget_config_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_config_variants_updated_at
    BEFORE UPDATE ON widget_config_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates
INSERT INTO widget_config_templates (name, description, category, config, is_public, is_featured) VALUES
(
    'E-commerce Support',
    'Optimized for online stores with product inquiries and order support',
    'e-commerce',
    '{
        "theme_settings": {
            "primaryColor": "#10b981",
            "backgroundColor": "#ffffff",
            "textColor": "#1f2937",
            "borderRadius": "12",
            "fontSize": "14"
        },
        "ai_settings": {
            "personality": "helpful",
            "responseLength": "concise",
            "enableSmartSuggestions": true
        },
        "behavior_settings": {
            "welcomeMessage": "👋 Welcome! Need help finding products or checking your order?",
            "botName": "Shopping Assistant"
        },
        "integration_settings": {
            "enableWooCommerce": true,
            "enableWebSearch": true
        }
    }'::jsonb,
    true,
    true
),
(
    'Customer Service',
    'Professional support desk configuration for B2B companies',
    'support',
    '{
        "theme_settings": {
            "primaryColor": "#3b82f6",
            "backgroundColor": "#ffffff",
            "textColor": "#1f2937",
            "borderRadius": "8",
            "fontSize": "14"
        },
        "ai_settings": {
            "personality": "professional",
            "responseLength": "detailed",
            "confidenceThreshold": 0.8
        },
        "behavior_settings": {
            "welcomeMessage": "Hello! How may I assist you today?",
            "botName": "Support Agent"
        },
        "analytics_settings": {
            "trackConversations": true,
            "trackPerformance": true
        }
    }'::jsonb,
    true,
    true
),
(
    'Sales Assistant',
    'Engaging configuration for lead generation and sales',
    'sales',
    '{
        "theme_settings": {
            "primaryColor": "#f59e0b",
            "backgroundColor": "#ffffff",
            "textColor": "#1f2937",
            "borderRadius": "16",
            "fontSize": "15"
        },
        "ai_settings": {
            "personality": "friendly",
            "responseLength": "balanced",
            "enableSmartSuggestions": true
        },
        "behavior_settings": {
            "welcomeMessage": "Hey there! 👋 Looking for something specific? I can help!",
            "botName": "Sales Assistant",
            "autoOpen": true,
            "openDelay": 5000
        }
    }'::jsonb,
    true,
    false
),
(
    'Minimalist',
    'Clean and simple design with focus on functionality',
    'custom',
    '{
        "theme_settings": {
            "primaryColor": "#000000",
            "backgroundColor": "#ffffff",
            "textColor": "#000000",
            "borderRadius": "0",
            "fontSize": "13"
        },
        "behavior_settings": {
            "showAvatar": false,
            "minimizable": true
        }
    }'::jsonb,
    true,
    false
);

-- Add RLS policies
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_config_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_config_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_config_variants ENABLE ROW LEVEL SECURITY;

-- Policies for widget_configs
CREATE POLICY "Users can view their own widget configs"
    ON widget_configs FOR SELECT
    USING (auth.uid() = created_by OR
           customer_config_id IN (
               SELECT id FROM customer_configs
               WHERE customer_id::uuid = auth.uid()
           ));

CREATE POLICY "Users can create widget configs"
    ON widget_configs FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own widget configs"
    ON widget_configs FOR UPDATE
    USING (auth.uid() = created_by OR auth.uid() = updated_by);

CREATE POLICY "Users can delete their own widget configs"
    ON widget_configs FOR DELETE
    USING (auth.uid() = created_by);

-- Policies for templates (public templates visible to all)
CREATE POLICY "Anyone can view public templates"
    ON widget_config_templates FOR SELECT
    USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates"
    ON widget_config_templates FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
    ON widget_config_templates FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
    ON widget_config_templates FOR DELETE
    USING (auth.uid() = created_by);

-- Comments for documentation
COMMENT ON TABLE widget_configs IS 'Stores widget configuration for each customer, supporting multi-tenant customization';
COMMENT ON TABLE widget_config_templates IS 'Pre-defined widget configuration templates that users can apply';
COMMENT ON TABLE widget_config_history IS 'Version history tracking for widget configurations';
COMMENT ON TABLE widget_config_variants IS 'A/B testing variants for widget configurations';

COMMENT ON COLUMN widget_configs.theme_settings IS 'Visual customization including colors, fonts, and styling';
COMMENT ON COLUMN widget_configs.ai_settings IS 'AI behavior configuration including personality and response preferences';
COMMENT ON COLUMN widget_configs.integration_settings IS 'Third-party integration settings including WooCommerce and webhooks';
COMMENT ON COLUMN widget_configs.analytics_settings IS 'Analytics and tracking configuration';
COMMENT ON COLUMN widget_configs.branding_settings IS 'Multi-tenant branding configuration';