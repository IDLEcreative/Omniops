-- Dashboard Sample Data Seed (Schema-Aligned)
-- Purpose: Provides sample telemetry data for staging/development environments
-- Usage: Apply via Supabase MCP or psql

-- Clean existing sample data
DELETE FROM public.chat_telemetry WHERE domain IN ('demo.example.com', 'staging.test.com');

-- Insert sample telemetry data spanning 7 days
-- Using NULL for conversation_id since it's optional in the schema

-- Day 7 (oldest)
INSERT INTO public.chat_telemetry (
  domain, model, success, duration_ms,
  input_tokens, output_tokens, total_tokens, cost_usd,
  search_count, iterations, created_at
)
VALUES
  ('demo.example.com', 'gpt-4o-mini', true, 1200, 450, 180, 630, 0.00063, 1, 1, NOW() - INTERVAL '7 days' + INTERVAL '10 hours'),
  ('demo.example.com', 'gpt-4o-mini', true, 980, 380, 150, 530, 0.00053, 0, 1, NOW() - INTERVAL '7 days' + INTERVAL '14 hours'),
  ('staging.test.com', 'gpt-4o', true, 2100, 820, 340, 1160, 0.01160, 2, 2, NOW() - INTERVAL '7 days' + INTERVAL '16 hours');

-- Day 6
INSERT INTO public.chat_telemetry (
  domain, model, success, duration_ms,
  input_tokens, output_tokens, total_tokens, cost_usd,
  search_count, iterations, created_at
)
VALUES
  ('demo.example.com', 'gpt-4o-mini', true, 1100, 420, 165, 585, 0.00059, 1, 1, NOW() - INTERVAL '6 days' + INTERVAL '9 hours'),
  ('demo.example.com', 'gpt-4o', true, 1850, 720, 290, 1010, 0.01010, 2, 2, NOW() - INTERVAL '6 days' + INTERVAL '11 hours'),
  ('staging.test.com', 'gpt-4o-mini', true, 1050, 400, 160, 560, 0.00056, 1, 1, NOW() - INTERVAL '6 days' + INTERVAL '15 hours');

-- Day 5
INSERT INTO public.chat_telemetry (
  domain, model, success, duration_ms,
  input_tokens, output_tokens, total_tokens, cost_usd,
  search_count, iterations, created_at
)
VALUES
  ('demo.example.com', 'gpt-4o-mini', true, 1250, 470, 185, 655, 0.00066, 1, 1, NOW() - INTERVAL '5 days' + INTERVAL '8 hours'),
  ('demo.example.com', 'gpt-4o-mini', false, 850, 350, 0, 350, 0.00035, 0, 1, NOW() - INTERVAL '5 days' + INTERVAL '12 hours'),
  ('staging.test.com', 'gpt-4o', true, 2300, 880, 360, 1240, 0.01240, 3, 2, NOW() - INTERVAL '5 days' + INTERVAL '17 hours');

-- Day 4
INSERT INTO public.chat_telemetry (
  domain, model, success, duration_ms,
  input_tokens, output_tokens, total_tokens, cost_usd,
  search_count, iterations, created_at
)
VALUES
  ('demo.example.com', 'gpt-4o', true, 1950, 750, 305, 1055, 0.01055, 2, 2, NOW() - INTERVAL '4 days' + INTERVAL '10 hours'),
  ('demo.example.com', 'gpt-4o-mini', true, 1080, 410, 170, 580, 0.00058, 1, 1, NOW() - INTERVAL '4 days' + INTERVAL '13 hours'),
  ('staging.test.com', 'gpt-4o-mini', true, 1150, 440, 175, 615, 0.00062, 1, 1, NOW() - INTERVAL '4 days' + INTERVAL '16 hours');

-- Day 3
INSERT INTO public.chat_telemetry (
  domain, model, success, duration_ms,
  input_tokens, output_tokens, total_tokens, cost_usd,
  search_count, iterations, created_at
)
VALUES
  ('demo.example.com', 'gpt-4o-mini', true, 1020, 390, 155, 545, 0.00055, 1, 1, NOW() - INTERVAL '3 days' + INTERVAL '9 hours'),
  ('demo.example.com', 'gpt-4o', true, 2050, 790, 320, 1110, 0.01110, 2, 2, NOW() - INTERVAL '3 days' + INTERVAL '14 hours'),
  ('staging.test.com', 'gpt-4o-mini', true, 1200, 460, 180, 640, 0.00064, 1, 1, NOW() - INTERVAL '3 days' + INTERVAL '15 hours');

-- Day 2
INSERT INTO public.chat_telemetry (
  domain, model, success, duration_ms,
  input_tokens, output_tokens, total_tokens, cost_usd,
  search_count, iterations, created_at
)
VALUES
  ('demo.example.com', 'gpt-4o-mini', true, 1100, 420, 168, 588, 0.00059, 1, 1, NOW() - INTERVAL '2 days' + INTERVAL '10 hours'),
  ('demo.example.com', 'gpt-4o-mini', true, 950, 370, 148, 518, 0.00052, 0, 1, NOW() - INTERVAL '2 days' + INTERVAL '12 hours'),
  ('staging.test.com', 'gpt-4o', true, 2200, 850, 345, 1195, 0.01195, 2, 2, NOW() - INTERVAL '2 days' + INTERVAL '16 hours');

-- Day 1 (yesterday)
INSERT INTO public.chat_telemetry (
  domain, model, success, duration_ms,
  input_tokens, output_tokens, total_tokens, cost_usd,
  search_count, iterations, created_at
)
VALUES
  ('demo.example.com', 'gpt-4o', true, 1900, 730, 295, 1025, 0.01025, 2, 2, NOW() - INTERVAL '1 day' + INTERVAL '8 hours'),
  ('demo.example.com', 'gpt-4o-mini', true, 1050, 400, 160, 560, 0.00056, 1, 1, NOW() - INTERVAL '1 day' + INTERVAL '11 hours'),
  ('staging.test.com', 'gpt-4o-mini', true, 1180, 450, 178, 628, 0.00063, 1, 1, NOW() - INTERVAL '1 day' + INTERVAL '14 hours');

-- Today
INSERT INTO public.chat_telemetry (
  domain, model, success, duration_ms,
  input_tokens, output_tokens, total_tokens, cost_usd,
  search_count, iterations, created_at
)
VALUES
  ('demo.example.com', 'gpt-4o-mini', true, 1080, 410, 165, 575, 0.00058, 1, 1, NOW() - INTERVAL '4 hours'),
  ('demo.example.com', 'gpt-4o', true, 2100, 810, 330, 1140, 0.01140, 2, 2, NOW() - INTERVAL '2 hours'),
  ('staging.test.com', 'gpt-4o-mini', true, 1150, 440, 175, 615, 0.00062, 1, 1, NOW() - INTERVAL '1 hour');

-- Trigger rollup refresh to populate aggregation tables
SELECT public.refresh_chat_telemetry_rollups('hour', NOW() - INTERVAL '7 days');
SELECT public.refresh_chat_telemetry_rollups('day', NOW() - INTERVAL '7 days');

-- Verify seed data was inserted
SELECT
  'Telemetry records' AS entity,
  COUNT(*) AS count
FROM public.chat_telemetry
WHERE domain IN ('demo.example.com', 'staging.test.com')
  AND created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  'Hourly rollups',
  COUNT(*)
FROM public.chat_telemetry_rollups
WHERE granularity = 'hour'
  AND bucket_start >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  'Daily rollups',
  COUNT(*)
FROM public.chat_telemetry_rollups
WHERE granularity = 'day'
  AND bucket_start >= NOW() - INTERVAL '7 days';
