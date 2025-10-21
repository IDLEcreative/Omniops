-- Drop template-related tables from the widget configuration system
-- These tables are no longer needed as templates have been removed

-- Drop foreign key constraint first if it exists
ALTER TABLE widget_configs DROP COLUMN IF EXISTS template_id;

-- Drop the template tables
DROP TABLE IF EXISTS widget_config_templates CASCADE;

-- Note: widget_configs, widget_config_history, and widget_config_variants tables remain
-- as they are still needed for the core configuration functionality