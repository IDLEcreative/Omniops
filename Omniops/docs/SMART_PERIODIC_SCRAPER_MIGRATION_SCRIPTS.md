# Smart Periodic Scraper - Database Migration Scripts

## Migration Files for Implementation

### Migration 001: Create Core Scraping Tables

```sql
-- 001_create_scraping_tables.sql
-- Run this migration to set up the core tables for Smart Periodic Scraping

BEGIN;

-- Customer scraping configurations
CREATE TABLE IF NOT EXISTS scraping_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    domain VARCHAR(255) NOT NULL,
    mode VARCHAR(20) DEFAULT 'manual' CHECK (mode IN ('manual', 'scheduled', 'smart')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Configuration stored as JSONB for flexibility
    config JSONB DEFAULT '{}',
    
    -- Statistics for monitoring
    total_pages INTEGER DEFAULT 0,
    last_full_scrape TIMESTAMPTZ,
    last_incremental_check TIMESTAMPTZ,
    total_checks INTEGER DEFAULT 0,
    total_changes INTEGER DEFAULT 0,
    
    UNIQUE(customer_id, domain)
);

-- Scraping schedules with cron expressions
CREATE TABLE IF NOT EXISTS scraping_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES scraping_configs(id) ON DELETE CASCADE,
    
    -- Schedule settings
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'custom')),
    cron_expression VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    next_run TIMESTAMPTZ,
    last_run TIMESTAMPTZ,
    
    -- Advanced configuration
    page_type_schedules JSONB DEFAULT '{}',
    max_concurrent INTEGER DEFAULT 5 CHECK (max_concurrent > 0 AND max_concurrent <= 100),
    request_delay INTEGER DEFAULT 1000 CHECK (request_delay >= 0),
    
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(config_id)
);

-- Metadata for scraped pages with change tracking
CREATE TABLE IF NOT EXISTS scraped_pages_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES scraping_configs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    
    -- Page information
    title TEXT,
    page_type VARCHAR(50),
    content_hash VARCHAR(64),
    content_length INTEGER,
    
    -- HTTP headers for change detection
    etag VARCHAR(255),
    last_modified_header VARCHAR(255),
    
    -- Tracking timestamps
    first_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_checked TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMPTZ,
    check_count INTEGER DEFAULT 0,
    change_count INTEGER DEFAULT 0,
    
    -- Performance and priority metrics
    avg_scrape_time INTEGER,
    avg_change_frequency FLOAT,
    priority_score FLOAT DEFAULT 1.0,
    
    UNIQUE(config_id, url)
);

-- History of detected changes for pattern analysis
CREATE TABLE IF NOT EXISTS scraping_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES scraped_pages_metadata(id) ON DELETE CASCADE,
    
    detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    change_type VARCHAR(50) CHECK (change_type IN ('content', 'structure', 'minor', 'major', 'deleted')),
    size_delta INTEGER,
    
    -- Detailed change information
    old_hash VARCHAR(64),
    new_hash VARCHAR(64),
    changes JSONB DEFAULT '{}',
    
    -- Performance tracking
    detection_time_ms INTEGER
);

-- Scraping job tracking
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES scraping_configs(id),
    
    job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('full', 'incremental', 'smart', 'manual')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Timing information
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Job results
    pages_checked INTEGER DEFAULT 0,
    pages_changed INTEGER DEFAULT 0,
    pages_added INTEGER DEFAULT 0,
    pages_deleted INTEGER DEFAULT 0,
    pages_failed INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Job metadata
    initiated_by VARCHAR(50), -- 'scheduler', 'user', 'api', 'smart_engine'
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_scraping_configs_active ON scraping_configs(is_active) WHERE is_active = true;
CREATE INDEX idx_scraping_configs_customer ON scraping_configs(customer_id);
CREATE INDEX idx_scraping_schedules_next_run ON scraping_schedules(next_run) WHERE is_enabled = true;
CREATE INDEX idx_pages_config_url ON scraped_pages_metadata(config_id, url);
CREATE INDEX idx_pages_last_checked ON scraped_pages_metadata(last_checked);
CREATE INDEX idx_pages_priority ON scraped_pages_metadata(config_id, priority_score DESC);
CREATE INDEX idx_change_history_page ON scraping_change_history(page_id, detected_at DESC);
CREATE INDEX idx_jobs_config_status ON scraping_jobs(config_id, status);
CREATE INDEX idx_jobs_created ON scraping_jobs(created_at DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_scraping_configs_updated_at 
    BEFORE UPDATE ON scraping_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

### Migration 002: Create Monitoring Views

```sql
-- 002_create_monitoring_views.sql
-- Create views for monitoring and analytics

BEGIN;

-- Main dashboard view
CREATE OR REPLACE VIEW v_scraping_dashboard AS
SELECT 
    sc.id,
    sc.customer_id,
    sc.domain,
    sc.mode,
    sc.is_active,
    sc.total_pages,
    sc.last_full_scrape,
    sc.last_incremental_check,
    ss.frequency,
    ss.next_run,
    ss.is_enabled as schedule_enabled,
    COUNT(DISTINCT spm.id) as unique_pages,
    SUM(spm.change_count) as total_changes_detected,
    AVG(sj.duration_ms)::INTEGER as avg_job_duration_ms,
    MAX(sj.completed_at) as last_job_completed
FROM scraping_configs sc
LEFT JOIN scraping_schedules ss ON ss.config_id = sc.id
LEFT JOIN scraped_pages_metadata spm ON spm.config_id = sc.id
LEFT JOIN scraping_jobs sj ON sj.config_id = sc.id AND sj.status = 'completed'
GROUP BY sc.id, sc.customer_id, sc.domain, sc.mode, sc.is_active, 
         sc.total_pages, sc.last_full_scrape, sc.last_incremental_check,
         ss.frequency, ss.next_run, ss.is_enabled;

-- Page change frequency analysis
CREATE OR REPLACE VIEW v_page_change_patterns AS
SELECT 
    spm.config_id,
    spm.page_type,
    COUNT(*) as page_count,
    AVG(spm.change_count)::FLOAT as avg_changes,
    AVG(spm.avg_change_frequency)::FLOAT as avg_change_frequency,
    MAX(spm.last_modified) as most_recent_change,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY spm.priority_score) as median_priority
FROM scraped_pages_metadata spm
GROUP BY spm.config_id, spm.page_type;

-- Job performance metrics
CREATE OR REPLACE VIEW v_job_performance AS
SELECT 
    config_id,
    job_type,
    DATE_TRUNC('day', created_at) as job_date,
    COUNT(*) as job_count,
    AVG(duration_ms)::INTEGER as avg_duration_ms,
    AVG(pages_checked)::INTEGER as avg_pages_checked,
    AVG(pages_changed)::INTEGER as avg_pages_changed,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
    AVG(CASE WHEN pages_checked > 0 
        THEN pages_changed::FLOAT / pages_checked 
        ELSE 0 END)::FLOAT as change_rate
FROM scraping_jobs
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY config_id, job_type, DATE_TRUNC('day', created_at);

-- Active jobs monitor
CREATE OR REPLACE VIEW v_active_jobs AS
SELECT 
    sj.id,
    sj.config_id,
    sc.domain,
    sj.job_type,
    sj.status,
    sj.started_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - sj.started_at))::INTEGER as running_seconds,
    sj.pages_checked,
    sj.pages_changed,
    sj.priority
FROM scraping_jobs sj
JOIN scraping_configs sc ON sc.id = sj.config_id
WHERE sj.status IN ('running', 'queued', 'pending')
ORDER BY sj.priority DESC, sj.created_at ASC;

COMMIT;
```

### Migration 003: Add RLS (Row Level Security)

```sql
-- 003_add_row_level_security.sql
-- Add row-level security for multi-tenant isolation

BEGIN;

-- Enable RLS on tables
ALTER TABLE scraping_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_pages_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for scraping_configs
CREATE POLICY scraping_configs_customer_policy ON scraping_configs
    FOR ALL
    USING (customer_id = auth.uid());

-- Create policies for scraping_schedules
CREATE POLICY scraping_schedules_customer_policy ON scraping_schedules
    FOR ALL
    USING (
        config_id IN (
            SELECT id FROM scraping_configs 
            WHERE customer_id = auth.uid()
        )
    );

-- Create policies for scraped_pages_metadata
CREATE POLICY scraped_pages_customer_policy ON scraped_pages_metadata
    FOR ALL
    USING (
        config_id IN (
            SELECT id FROM scraping_configs 
            WHERE customer_id = auth.uid()
        )
    );

-- Create policies for scraping_change_history
CREATE POLICY change_history_customer_policy ON scraping_change_history
    FOR ALL
    USING (
        page_id IN (
            SELECT spm.id FROM scraped_pages_metadata spm
            JOIN scraping_configs sc ON sc.id = spm.config_id
            WHERE sc.customer_id = auth.uid()
        )
    );

-- Create policies for scraping_jobs
CREATE POLICY scraping_jobs_customer_policy ON scraping_jobs
    FOR ALL
    USING (
        config_id IN (
            SELECT id FROM scraping_configs 
            WHERE customer_id = auth.uid()
        )
    );

COMMIT;
```

### Migration 004: Add Notification Tables

```sql
-- 004_add_notification_tables.sql
-- Tables for notification and alert management

BEGIN;

CREATE TABLE IF NOT EXISTS scraping_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES scraping_configs(id) ON DELETE CASCADE,
    
    -- Notification settings
    notify_on_changes BOOLEAN DEFAULT true,
    notify_on_errors BOOLEAN DEFAULT true,
    notify_on_completion BOOLEAN DEFAULT false,
    
    -- Thresholds for notifications
    min_changes_threshold INTEGER DEFAULT 1,
    error_threshold INTEGER DEFAULT 3,
    
    -- Contact methods
    email_addresses TEXT[],
    webhook_url TEXT,
    slack_webhook TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scraping_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES scraping_configs(id),
    job_id UUID REFERENCES scraping_jobs(id),
    
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    title TEXT NOT NULL,
    message TEXT,
    details JSONB DEFAULT '{}',
    
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX idx_notifications_config ON scraping_notifications(config_id);
CREATE INDEX idx_alerts_config ON scraping_alerts(config_id);
CREATE INDEX idx_alerts_unresolved ON scraping_alerts(is_resolved) WHERE is_resolved = false;

COMMIT;
```

### Migration 005: Add Analytics Tables

```sql
-- 005_add_analytics_tables.sql
-- Tables for detailed analytics and reporting

BEGIN;

CREATE TABLE IF NOT EXISTS scraping_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES scraping_configs(id) ON DELETE CASCADE,
    
    -- Time period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type VARCHAR(20) CHECK (period_type IN ('hour', 'day', 'week', 'month')),
    
    -- Metrics
    total_scrapes INTEGER DEFAULT 0,
    total_pages_checked INTEGER DEFAULT 0,
    total_changes_detected INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    
    -- Performance
    avg_response_time_ms INTEGER,
    total_bandwidth_bytes BIGINT,
    total_duration_ms BIGINT,
    
    -- Cost metrics
    estimated_cost_cents INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(config_id, period_start, period_type)
);

-- Pattern detection for smart scheduling
CREATE TABLE IF NOT EXISTS scraping_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES scraping_configs(id) ON DELETE CASCADE,
    page_type VARCHAR(50),
    
    -- Pattern data
    hour_of_day INTEGER[] DEFAULT ARRAY[]::INTEGER[],  -- Hours when changes occur
    day_of_week INTEGER[] DEFAULT ARRAY[]::INTEGER[],  -- Days when changes occur
    change_frequency_per_day FLOAT,
    
    -- Confidence metrics
    sample_size INTEGER DEFAULT 0,
    confidence_score FLOAT DEFAULT 0.0,
    
    last_analyzed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(config_id, page_type)
);

CREATE INDEX idx_analytics_config_period ON scraping_analytics(config_id, period_start DESC);
CREATE INDEX idx_patterns_config ON scraping_patterns(config_id);

COMMIT;
```

### Rollback Scripts

```sql
-- rollback_all.sql
-- Emergency rollback script to remove all scraping tables

BEGIN;

-- Drop views first
DROP VIEW IF EXISTS v_active_jobs CASCADE;
DROP VIEW IF EXISTS v_job_performance CASCADE;
DROP VIEW IF EXISTS v_page_change_patterns CASCADE;
DROP VIEW IF EXISTS v_scraping_dashboard CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS scraping_patterns CASCADE;
DROP TABLE IF EXISTS scraping_analytics CASCADE;
DROP TABLE IF EXISTS scraping_alerts CASCADE;
DROP TABLE IF EXISTS scraping_notifications CASCADE;
DROP TABLE IF EXISTS scraping_change_history CASCADE;
DROP TABLE IF EXISTS scraping_jobs CASCADE;
DROP TABLE IF EXISTS scraped_pages_metadata CASCADE;
DROP TABLE IF EXISTS scraping_schedules CASCADE;
DROP TABLE IF EXISTS scraping_configs CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

COMMIT;
```

## Migration Execution Guide

### Prerequisites
1. Backup your database before running migrations
2. Ensure you have appropriate database permissions
3. Test migrations in a development environment first

### Execution Order
```bash
# Run migrations in sequence
psql -U your_user -d your_database -f 001_create_scraping_tables.sql
psql -U your_user -d your_database -f 002_create_monitoring_views.sql
psql -U your_user -d your_database -f 003_add_row_level_security.sql
psql -U your_user -d your_database -f 004_add_notification_tables.sql
psql -U your_user -d your_database -f 005_add_analytics_tables.sql

# Or use a migration tool like Flyway or Liquibase
```

### Verification Queries

```sql
-- Verify all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'scraping%'
ORDER BY table_name;

-- Verify all views created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'v_%'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'scraping%';

-- Verify indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'scraping%'
ORDER BY tablename, indexname;
```

## Post-Migration Tasks

1. **Grant Permissions**: Ensure application user has necessary permissions
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
```

2. **Set up monitoring**: Configure alerts for slow queries on these tables

3. **Schedule maintenance**: Set up regular VACUUM and ANALYZE jobs

4. **Document changes**: Update your database documentation

5. **Test application**: Run integration tests to verify everything works