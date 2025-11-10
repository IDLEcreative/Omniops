export const TABLES = [
  'report_subscriptions',
  'custom_funnels',
  'alert_thresholds',
  'alert_history'
] as const;

export const MATERIALIZED_VIEWS = [
  'daily_analytics_summary',
  'hourly_usage_stats',
  'weekly_analytics_summary'
] as const;

export const COMPONENT_FILES = [
  'components/analytics/MetricCard.tsx',
  'components/analytics/MetricsOverview.tsx',
  'components/analytics/ResponseTimeChart.tsx',
  'components/analytics/MessageVolumeChart.tsx',
  'components/analytics/SentimentChart.tsx',
  'components/analytics/PeakUsageChart.tsx',
  'components/analytics/CustomerJourneyFlow.tsx',
  'components/analytics/ConversionFunnelChart.tsx',
  'components/analytics/AlertSettings.tsx',
  'components/analytics/FunnelEditor.tsx',
  'components/analytics/AlertHistoryView.tsx',
  'components/analytics/ReportSettings.tsx',
  'hooks/use-analytics.ts',
  'hooks/use-business-intelligence.ts',
  'hooks/use-realtime-analytics.ts',
  'app/dashboard/analytics/page.tsx',
  'app/dashboard/alerts/page.tsx'
] as const;

export const API_ROUTES = [
  'app/api/analytics/export/csv/route.ts',
  'app/api/analytics/export/pdf/route.ts',
  'app/api/analytics/reports/subscribe/route.ts',
  'app/api/analytics/reports/test/route.ts',
  'app/api/analytics/funnels/route.ts',
  'app/api/analytics/alerts/route.ts'
] as const;

export const LIB_FILES = [
  'lib/websocket/server.ts',
  'lib/analytics/events.ts',
  'lib/analytics/export-csv.ts',
  'lib/analytics/export-pdf.ts',
  'lib/analytics/custom-funnels.ts',
  'lib/alerts/threshold-checker.ts',
  'lib/alerts/send-alert-email.ts',
  'lib/alerts/send-alert-webhook.ts',
  'lib/alerts/send-alert-slack.ts',
  'lib/email/send-report.ts',
  'lib/cron/scheduled-reports.ts'
] as const;

export const MIGRATION_FILES = [
  'supabase/migrations/20251107194557_analytics_materialized_views.sql',
  'supabase/migrations/20251107_report_subscriptions.sql',
  'supabase/migrations/20251107_custom_funnels.sql',
  'supabase/migrations/20251107_alert_thresholds.sql'
] as const;

export const REQUIRED_DEPENDENCIES: Record<string, string> = {
  recharts: 'Charts',
  'socket.io': 'WebSocket Server',
  'socket.io-client': 'WebSocket Client',
  papaparse: 'CSV Export',
  jspdf: 'PDF Export',
  'jspdf-autotable': 'PDF Tables',
  html2canvas: 'Chart Screenshots',
  nodemailer: 'Email Sending',
  'node-cron': 'Scheduled Jobs'
};
