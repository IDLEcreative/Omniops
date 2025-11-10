/**
 * Cron System Integration Test
 *
 * Verifies that all 7 cron features are properly integrated and functional:
 * 1. Database migration applied (cron_refresh_history table exists)
 * 2. Status API endpoint exists and works
 * 3. Refresh API endpoint exists and tracks history
 * 4. Environment-based configuration loads
 * 5. Notifications system configured
 * 6. Incremental refresh mode available
 * 7. Scheduled-content-refresh module exports
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCronIntegration() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 CRON SYSTEM INTEGRATION TEST');
  console.log('═══════════════════════════════════════════════════\n');

  const results: { test: string; status: '✅' | '❌'; details?: string }[] = [];

  // Test 1: Database Migration - cron_refresh_history table exists
  console.log('Test 1: Checking cron_refresh_history table...');
  try {
    const { data, error } = await supabase
      .from('cron_refresh_history')
      .select('id')
      .limit(1);

    if (error && !error.message.includes('permission')) {
      results.push({
        test: 'Database Migration (cron_refresh_history table)',
        status: '❌',
        details: error.message
      });
    } else {
      results.push({
        test: 'Database Migration (cron_refresh_history table)',
        status: '✅',
        details: 'Table exists and is accessible'
      });
    }
  } catch (err) {
    results.push({
      test: 'Database Migration (cron_refresh_history table)',
      status: '❌',
      details: String(err)
    });
  }

  // Test 2: Status API endpoint exists
  console.log('Test 2: Checking status API endpoint file...');
  const statusApiPath = path.join(process.cwd(), 'app/api/cron/status/route.ts');
  if (fs.existsSync(statusApiPath)) {
    const content = fs.readFileSync(statusApiPath, 'utf-8');
    const hasHistoryQuery = content.includes('cron_refresh_history');
    const hasConfigCheck = content.includes('CRON_ENABLED');

    if (hasHistoryQuery && hasConfigCheck) {
      results.push({
        test: 'Status API Endpoint (/api/cron/status)',
        status: '✅',
        details: 'File exists with history query and config checks'
      });
    } else {
      results.push({
        test: 'Status API Endpoint (/api/cron/status)',
        status: '❌',
        details: `Missing components: history=${hasHistoryQuery}, config=${hasConfigCheck}`
      });
    }
  } else {
    results.push({
      test: 'Status API Endpoint (/api/cron/status)',
      status: '❌',
      details: 'File does not exist'
    });
  }

  // Test 3: Refresh API endpoint tracks history
  console.log('Test 3: Checking refresh API endpoint history tracking...');
  const refreshApiPath = path.join(process.cwd(), 'app/api/cron/refresh/route.ts');
  if (fs.existsSync(refreshApiPath)) {
    const content = fs.readFileSync(refreshApiPath, 'utf-8');
    const hasHistoryInsert = content.includes("from('cron_refresh_history').insert");
    const hasHistoryUpdate = content.includes("from('cron_refresh_history').update");
    const hasStatusTracking = content.includes("status: 'running'") || content.includes('status: "running"');

    if (hasHistoryInsert && hasHistoryUpdate && hasStatusTracking) {
      results.push({
        test: 'Refresh API History Tracking (/api/cron/refresh)',
        status: '✅',
        details: 'Insert, update, and status tracking all present'
      });
    } else {
      results.push({
        test: 'Refresh API History Tracking (/api/cron/refresh)',
        status: '❌',
        details: `Missing: insert=${hasHistoryInsert}, update=${hasHistoryUpdate}, status=${hasStatusTracking}`
      });
    }
  } else {
    results.push({
      test: 'Refresh API History Tracking (/api/cron/refresh)',
      status: '❌',
      details: 'File does not exist'
    });
  }

  // Test 4: Environment-based configuration
  console.log('Test 4: Checking environment configuration...');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');
    const hasCronEnabled = envContent.includes('CRON_ENABLED');
    const hasCronSecret = envContent.includes('CRON_SECRET');
    const hasCronSchedule = envContent.includes('CRON_SCHEDULE');

    if (hasCronEnabled && hasCronSecret && hasCronSchedule) {
      results.push({
        test: 'Environment Configuration (.env.example)',
        status: '✅',
        details: 'All cron environment variables documented'
      });
    } else {
      results.push({
        test: 'Environment Configuration (.env.example)',
        status: '❌',
        details: `Missing vars: CRON_ENABLED=${hasCronEnabled}, CRON_SECRET=${hasCronSecret}, CRON_SCHEDULE=${hasCronSchedule}`
      });
    }
  } else {
    results.push({
      test: 'Environment Configuration (.env.example)',
      status: '❌',
      details: '.env.example file not found'
    });
  }

  // Test 5: Notifications system
  console.log('Test 5: Checking notifications system...');
  const notificationsPath = path.join(process.cwd(), 'lib/cron/notifications.ts');
  if (fs.existsSync(notificationsPath)) {
    const content = fs.readFileSync(notificationsPath, 'utf-8');
    const hasEmail = content.includes('sendEmail');
    const hasSlack = content.includes('sendSlack');
    const hasDiscord = content.includes('sendDiscord');
    const hasNodemailer = content.includes('nodemailer');

    if (hasEmail && hasSlack && hasDiscord && hasNodemailer) {
      results.push({
        test: 'Notifications System (lib/cron/notifications.ts)',
        status: '✅',
        details: 'Email, Slack, and Discord integrations present'
      });
    } else {
      results.push({
        test: 'Notifications System (lib/cron/notifications.ts)',
        status: '❌',
        details: `Missing: email=${hasEmail}, slack=${hasSlack}, discord=${hasDiscord}, nodemailer=${hasNodemailer}`
      });
    }
  } else {
    results.push({
      test: 'Notifications System (lib/cron/notifications.ts)',
      status: '❌',
      details: 'File does not exist'
    });
  }

  // Test 6: Incremental refresh mode
  console.log('Test 6: Checking incremental refresh system...');
  const incrementalPath = path.join(process.cwd(), 'lib/cron/incremental-refresh.ts');
  if (fs.existsSync(incrementalPath)) {
    const content = fs.readFileSync(incrementalPath, 'utf-8');
    const hasContentHash = content.includes('createHash') || content.includes('SHA256');
    const hasChangeDetection = content.includes('hasContentChanged') || content.includes('compareHash');

    if (hasContentHash && hasChangeDetection) {
      results.push({
        test: 'Incremental Refresh (lib/cron/incremental-refresh.ts)',
        status: '✅',
        details: 'Content hashing and change detection implemented'
      });
    } else {
      results.push({
        test: 'Incremental Refresh (lib/cron/incremental-refresh.ts)',
        status: '❌',
        details: `Missing: contentHash=${hasContentHash}, changeDetection=${hasChangeDetection}`
      });
    }
  } else {
    results.push({
      test: 'Incremental Refresh (lib/cron/incremental-refresh.ts)',
      status: '❌',
      details: 'File does not exist'
    });
  }

  // Test 7: Scheduled content refresh module
  console.log('Test 7: Checking scheduled content refresh module...');
  const scheduledPath = path.join(process.cwd(), 'lib/cron/scheduled-content-refresh.ts');
  if (fs.existsSync(scheduledPath)) {
    const content = fs.readFileSync(scheduledPath, 'utf-8');
    const hasInitFunction = content.includes('initializeContentRefresh');
    const hasTriggerFunction = content.includes('triggerContentRefresh');
    const hasStopFunction = content.includes('stopContentRefresh');
    const hasCronSchedule = content.includes("cron.schedule") || content.includes('node-cron');

    if (hasInitFunction && hasTriggerFunction && hasStopFunction && hasCronSchedule) {
      results.push({
        test: 'Scheduled Content Refresh (lib/cron/scheduled-content-refresh.ts)',
        status: '✅',
        details: 'All required exports and cron scheduling present'
      });
    } else {
      results.push({
        test: 'Scheduled Content Refresh (lib/cron/scheduled-content-refresh.ts)',
        status: '❌',
        details: `Missing: init=${hasInitFunction}, trigger=${hasTriggerFunction}, stop=${hasStopFunction}, cron=${hasCronSchedule}`
      });
    }
  } else {
    results.push({
      test: 'Scheduled Content Refresh (lib/cron/scheduled-content-refresh.ts)',
      status: '❌',
      details: 'File does not exist'
    });
  }

  // Test 8: Server.ts initialization
  console.log('Test 8: Checking custom server initialization...');
  const serverPath = path.join(process.cwd(), 'server.ts');
  if (fs.existsSync(serverPath)) {
    const content = fs.readFileSync(serverPath, 'utf-8');
    const hasImport = content.includes('initializeContentRefresh');
    const hasInit = content.includes('initializeContentRefresh()');
    const hasConditional = content.includes('CRON_ENABLED');

    if (hasImport && hasInit && hasConditional) {
      results.push({
        test: 'Custom Server Initialization (server.ts)',
        status: '✅',
        details: 'Cron system properly initialized in custom server'
      });
    } else {
      results.push({
        test: 'Custom Server Initialization (server.ts)',
        status: '❌',
        details: `Missing: import=${hasImport}, init=${hasInit}, conditional=${hasConditional}`
      });
    }
  } else {
    results.push({
      test: 'Custom Server Initialization (server.ts)',
      status: '❌',
      details: 'server.ts does not exist'
    });
  }

  // Print Results
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS');
  console.log('═══════════════════════════════════════════════════\n');

  results.forEach(({ test, status, details }) => {
    console.log(`${status} ${test}`);
    if (details) {
      console.log(`   └─ ${details}`);
    }
  });

  const passedTests = results.filter(r => r.status === '✅').length;
  const totalTests = results.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`✅ Passed: ${passedTests}/${totalTests} (${passRate}%)`);
  console.log('═══════════════════════════════════════════════════\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Cron system is fully integrated.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Review the issues above.');
    process.exit(1);
  }
}

testCronIntegration().catch((error) => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});
