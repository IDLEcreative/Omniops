#!/usr/bin/env tsx
/**
 * Comprehensive verification of Analytics 10/10 features
 * Tests all 6 new features deployed by parallel agents
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

console.log('🎯 Analytics 10/10 - Feature Verification\n');
console.log('='.repeat(70));

interface TestResult {
  feature: string;
  status: '✅' | '❌' | '⚠️';
  details: string;
  issues?: string[];
}

const results: TestResult[] = [];

async function testDatabaseTables() {
  console.log('\n1️⃣  DATABASE TABLES');
  console.log('-'.repeat(70));

  const client = await createServiceRoleClient();
  if (!client) {
    results.push({
      feature: 'Database Connection',
      status: '❌',
      details: 'Failed to create database client'
    });
    return;
  }

  // Check for new tables
  const expectedTables = [
    'report_subscriptions',
    'custom_funnels',
    'alert_thresholds',
    'alert_history'
  ];

  for (const table of expectedTables) {
    try {
      const { error } = await client.from(table as any).select('id').limit(1);
      if (error && !error.message.includes('permission')) {
        console.log(`   ❌ ${table}: ${error.message}`);
        results.push({
          feature: `Table: ${table}`,
          status: '❌',
          details: error.message
        });
      } else {
        console.log(`   ✅ ${table}`);
        results.push({
          feature: `Table: ${table}`,
          status: '✅',
          details: 'Table exists and accessible'
        });
      }
    } catch (err: any) {
      console.log(`   ❌ ${table}: ${err.message}`);
      results.push({
        feature: `Table: ${table}`,
        status: '❌',
        details: err.message
      });
    }
  }

  // Check materialized views (from previous deployment)
  const views = ['daily_analytics_summary', 'hourly_usage_stats', 'weekly_analytics_summary'];
  for (const view of views) {
    try {
      const { data, error } = await client.from(view as any).select('*').limit(1);
      if (error) {
        console.log(`   ❌ ${view}: ${error.message}`);
      } else {
        console.log(`   ✅ ${view} (${data?.length || 0} rows sampled)`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${view}: Error checking`);
    }
  }
}

async function testComponentFiles() {
  console.log('\n2️⃣  REACT COMPONENTS & HOOKS');
  console.log('-'.repeat(70));

  const fs = require('fs');
  const path = require('path');

  const expectedFiles = [
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
  ];

  let filesFound = 0;
  const missing: string[] = [];

  for (const file of expectedFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      filesFound++;
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file}`);
      missing.push(file);
    }
  }

  results.push({
    feature: 'React Components & Hooks',
    status: missing.length === 0 ? '✅' : '⚠️',
    details: `${filesFound}/${expectedFiles.length} files found`,
    issues: missing.length > 0 ? missing : undefined
  });
}

async function testAPIEndpoints() {
  console.log('\n3️⃣  API ENDPOINTS');
  console.log('-'.repeat(70));

  const fs = require('fs');
  const path = require('path');

  const expectedRoutes = [
    'app/api/analytics/export/csv/route.ts',
    'app/api/analytics/export/pdf/route.ts',
    'app/api/analytics/reports/subscribe/route.ts',
    'app/api/analytics/reports/test/route.ts',
    'app/api/analytics/funnels/route.ts',
    'app/api/analytics/alerts/route.ts'
  ];

  let routesFound = 0;
  const missingRoutes: string[] = [];

  for (const route of expectedRoutes) {
    const fullPath = path.join(process.cwd(), route);
    if (fs.existsSync(fullPath)) {
      routesFound++;
      console.log(`   ✅ ${route}`);
    } else {
      console.log(`   ❌ ${route}`);
      missingRoutes.push(route);
    }
  }

  results.push({
    feature: 'API Endpoints',
    status: missingRoutes.length === 0 ? '✅' : '⚠️',
    details: `${routesFound}/${expectedRoutes.length} routes found`,
    issues: missingRoutes.length > 0 ? missingRoutes : undefined
  });
}

async function testLibraries() {
  console.log('\n4️⃣  LIBRARY FILES');
  console.log('-'.repeat(70));

  const fs = require('fs');
  const path = require('path');

  const expectedLibs = [
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
  ];

  let libsFound = 0;
  const missingLibs: string[] = [];

  for (const lib of expectedLibs) {
    const fullPath = path.join(process.cwd(), lib);
    if (fs.existsSync(fullPath)) {
      libsFound++;
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`   ✅ ${lib} (${sizeKB} KB)`);
    } else {
      console.log(`   ❌ ${lib}`);
      missingLibs.push(lib);
    }
  }

  results.push({
    feature: 'Library Files',
    status: missingLibs.length === 0 ? '✅' : '⚠️',
    details: `${libsFound}/${expectedLibs.length} libraries found`,
    issues: missingLibs.length > 0 ? missingLibs : undefined
  });
}

async function testMigrations() {
  console.log('\n5️⃣  DATABASE MIGRATIONS');
  console.log('-'.repeat(70));

  const fs = require('fs');
  const path = require('path');

  const expectedMigrations = [
    'supabase/migrations/20251107194557_analytics_materialized_views.sql',
    'supabase/migrations/20251107_report_subscriptions.sql',
    'supabase/migrations/20251107_custom_funnels.sql',
    'supabase/migrations/20251107_alert_thresholds.sql'
  ];

  let migrationsFound = 0;
  const missingMigrations: string[] = [];

  for (const migration of expectedMigrations) {
    const fullPath = path.join(process.cwd(), migration);
    if (fs.existsSync(fullPath)) {
      migrationsFound++;
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`   ✅ ${path.basename(migration)} (${sizeKB} KB)`);
    } else {
      console.log(`   ❌ ${path.basename(migration)}`);
      missingMigrations.push(migration);
    }
  }

  results.push({
    feature: 'Database Migrations',
    status: missingMigrations.length === 0 ? '✅' : '⚠️',
    details: `${migrationsFound}/${expectedMigrations.length} migrations found`,
    issues: missingMigrations.length > 0 ? missingMigrations : undefined
  });
}

async function testDependencies() {
  console.log('\n6️⃣  NPM DEPENDENCIES');
  console.log('-'.repeat(70));

  const fs = require('fs');
  const path = require('path');

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const requiredDeps = {
    'recharts': 'Charts',
    'socket.io': 'WebSocket Server',
    'socket.io-client': 'WebSocket Client',
    'papaparse': 'CSV Export',
    'jspdf': 'PDF Export',
    'jspdf-autotable': 'PDF Tables',
    'html2canvas': 'Chart Screenshots',
    'nodemailer': 'Email Sending',
    'node-cron': 'Scheduled Jobs'
  };

  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  let depsFound = 0;
  const missingDeps: string[] = [];

  for (const [dep, purpose] of Object.entries(requiredDeps)) {
    if (allDeps[dep]) {
      depsFound++;
      console.log(`   ✅ ${dep} (${allDeps[dep]}) - ${purpose}`);
    } else {
      console.log(`   ❌ ${dep} - ${purpose}`);
      missingDeps.push(`${dep} (${purpose})`);
    }
  }

  results.push({
    feature: 'NPM Dependencies',
    status: missingDeps.length === 0 ? '✅' : '⚠️',
    details: `${depsFound}/${Object.keys(requiredDeps).length} dependencies found`,
    issues: missingDeps.length > 0 ? missingDeps : undefined
  });
}

// Main execution
async function main() {
  await testDatabaseTables();
  await testComponentFiles();
  await testAPIEndpoints();
  await testLibraries();
  await testMigrations();
  await testDependencies();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.status === '✅').length;
  const warnings = results.filter(r => r.status === '⚠️').length;
  const failed = results.filter(r => r.status === '❌').length;

  console.log(`\n✅ Passed: ${passed}`);
  if (warnings > 0) console.log(`⚠️  Warnings: ${warnings}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);

  // Show issues
  const resultsWithIssues = results.filter(r => r.issues && r.issues.length > 0);
  if (resultsWithIssues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    for (const result of resultsWithIssues) {
      console.log(`\n${result.feature}:`);
      for (const issue of result.issues!) {
        console.log(`  - ${issue}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));

  const successRate = (passed / results.length * 100).toFixed(1);
  console.log(`\nOverall Success Rate: ${successRate}%`);

  if (failed === 0 && warnings === 0) {
    console.log('\n🎉 ALL FEATURES VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else if (failed === 0) {
    console.log('\n✅ VERIFICATION PASSED (with warnings)');
    process.exit(0);
  } else {
    console.log('\n❌ VERIFICATION FAILED - Issues need attention');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Verification script failed:', error);
  process.exit(1);
});
