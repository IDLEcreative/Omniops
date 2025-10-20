#!/usr/bin/env tsx
/**
 * Validation script for monitoring system
 * Tests all components of the monitoring and alerting infrastructure
 */

import { createClient } from '@supabase/supabase-js';
import { sendAlert } from '../lib/alerts/notify';

// Use NEXT_PUBLIC variables if regular ones aren't set
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: ValidationResult[] = [];

async function validateEnvironment() {
  console.log('🔍 Validating Environment Variables...\n');

  // Check Supabase configuration
  if (SUPABASE_URL) {
    results.push({
      component: 'SUPABASE_URL',
      status: 'pass',
      message: `Configured: ${SUPABASE_URL}`,
    });
  } else {
    results.push({
      component: 'SUPABASE_URL',
      status: 'fail',
      message: 'Not configured',
    });
  }

  if (SUPABASE_SERVICE_ROLE_KEY) {
    results.push({
      component: 'SUPABASE_SERVICE_ROLE_KEY',
      status: 'pass',
      message: 'Configured (hidden)',
    });
  } else {
    results.push({
      component: 'SUPABASE_SERVICE_ROLE_KEY',
      status: 'fail',
      message: 'Not configured',
    });
  }

  // Check webhook configuration
  if (process.env.MONITOR_ALERT_WEBHOOK_URL) {
    results.push({
      component: 'MONITOR_ALERT_WEBHOOK_URL',
      status: 'pass',
      message: 'Webhook configured',
    });
  } else {
    results.push({
      component: 'MONITOR_ALERT_WEBHOOK_URL',
      status: 'warning',
      message: 'Not configured (alerts will be skipped)',
    });
  }
}

async function validateDatabase() {
  console.log('🗄️  Validating Database Tables...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    results.push({
      component: 'Database Connection',
      status: 'fail',
      message: 'Missing Supabase credentials',
    });
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Check telemetry tables
  const tables = [
    'chat_telemetry',
    'chat_telemetry_rollups',
    'chat_telemetry_domain_rollups',
    'chat_telemetry_model_rollups',
    'gdpr_audit_log',
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results.push({
          component: `Table: ${table}`,
          status: 'fail',
          message: error.message,
        });
      } else {
        results.push({
          component: `Table: ${table}`,
          status: 'pass',
          message: `Exists (${count ?? 0} rows)`,
        });
      }
    } catch (error) {
      results.push({
        component: `Table: ${table}`,
        status: 'fail',
        message: String(error),
      });
    }
  }
}

async function validateAlertSystem() {
  console.log('📢 Validating Alert System...\n');

  if (!process.env.MONITOR_ALERT_WEBHOOK_URL) {
    results.push({
      component: 'Alert System',
      status: 'warning',
      message: 'Webhook not configured, skipping test',
    });
    return;
  }

  try {
    const success = await sendAlert({
      title: '✅ Monitoring System Validation',
      message: 'This is a test alert from the validation script. All systems operational.',
      severity: 'info',
      context: {
        'Validation Time': new Date().toISOString(),
        'Environment': process.env.NODE_ENV || 'development',
      },
    });

    results.push({
      component: 'Alert System',
      status: success ? 'pass' : 'fail',
      message: success ? 'Test alert sent successfully' : 'Failed to send test alert',
    });
  } catch (error) {
    results.push({
      component: 'Alert System',
      status: 'fail',
      message: String(error),
    });
  }
}

async function validateMonitoringScripts() {
  console.log('🔧 Validating Monitoring Scripts...\n');

  const scripts = [
    'scripts/monitor-telemetry-rollups.ts',
    'scripts/monitor-gdpr-audit.ts',
    'scripts/notify-monitor-failure.ts',
  ];

  const fs = await import('fs');

  for (const script of scripts) {
    if (fs.existsSync(script)) {
      results.push({
        component: `Script: ${script}`,
        status: 'pass',
        message: 'File exists',
      });
    } else {
      results.push({
        component: `Script: ${script}`,
        status: 'fail',
        message: 'File not found',
      });
    }
  }
}

async function validateGitHubWorkflow() {
  console.log('🚀 Validating GitHub Workflow...\n');

  const fs = await import('fs');
  const workflowPath = '.github/workflows/nightly-telemetry-gdpr.yml';

  if (fs.existsSync(workflowPath)) {
    results.push({
      component: 'GitHub Workflow',
      status: 'pass',
      message: 'Workflow file exists',
    });

    // Check if GitHub CLI is available
    const { execSync } = await import('child_process');
    try {
      execSync('gh --version', { stdio: 'ignore' });
      results.push({
        component: 'GitHub CLI',
        status: 'pass',
        message: 'GitHub CLI is installed',
      });
    } catch {
      results.push({
        component: 'GitHub CLI',
        status: 'warning',
        message: 'GitHub CLI not found (needed for workflow testing)',
      });
    }
  } else {
    results.push({
      component: 'GitHub Workflow',
      status: 'fail',
      message: 'Workflow file not found',
    });
  }
}

function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter((r) => r.status === 'pass');
  const warnings = results.filter((r) => r.status === 'warning');
  const failed = results.filter((r) => r.status === 'fail');

  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.component}`);
    console.log(`   ${result.message}\n`);
  });

  console.log('='.repeat(60));
  console.log(`Summary: ${passed.length} passed, ${warnings.length} warnings, ${failed.length} failed`);
  console.log('='.repeat(60) + '\n');

  if (failed.length > 0) {
    console.log('❌ Some components failed validation. Please address the issues above.\n');
    return false;
  } else if (warnings.length > 0) {
    console.log('⚠️  Validation completed with warnings. The system will work but some features may be limited.\n');
    return true;
  } else {
    console.log('✅ All components validated successfully!\n');
    return true;
  }
}

async function generateSetupCommands() {
  console.log('📝 Setup Commands for GitHub Secrets:\n');
  console.log('```bash');
  console.log('# Set up GitHub secrets (replace with your actual values)');
  console.log(`gh secret set SUPABASE_URL --body "${SUPABASE_URL || 'YOUR_SUPABASE_URL'}"`);
  console.log('gh secret set SUPABASE_SERVICE_ROLE_KEY --body "YOUR_SERVICE_ROLE_KEY"');
  console.log('gh secret set MONITOR_ALERT_WEBHOOK_URL --body "YOUR_WEBHOOK_URL"');
  console.log('');
  console.log('# Test the workflow');
  console.log('gh workflow run "Nightly Telemetry & GDPR Validation"');
  console.log('');
  console.log('# Check workflow status');
  console.log('gh run list --workflow="Nightly Telemetry & GDPR Validation"');
  console.log('```\n');
}

async function main() {
  console.log('🎯 Monitoring System Validation\n');
  console.log('This script validates all components of the monitoring system.\n');
  console.log('='.repeat(60) + '\n');

  // Load environment
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });

  // Run validations
  await validateEnvironment();
  await validateDatabase();
  await validateAlertSystem();
  await validateMonitoringScripts();
  await validateGitHubWorkflow();

  // Print results
  const success = printResults();

  // Generate setup commands
  await generateSetupCommands();

  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error('Validation failed with error:', error);
  process.exit(1);
});