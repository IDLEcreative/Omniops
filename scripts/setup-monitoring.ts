#!/usr/bin/env tsx
/**
 * Setup script for monitoring and alerting system
 * Helps configure environment variables and validate the monitoring setup
 */

import { config } from 'dotenv';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> =>
  new Promise((resolve) => rl.question(prompt, resolve));

async function checkEnvironmentVariables() {
  console.log('\n📋 Checking environment variables...\n');

  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'MONITOR_ALERT_WEBHOOK_URL'
  ];

  const missing: string[] = [];
  const present: string[] = [];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      present.push(varName);
      console.log(`✅ ${varName} is configured`);
    } else {
      missing.push(varName);
      console.log(`❌ ${varName} is missing`);
    }
  }

  return { missing, present };
}

async function setupLocalEnvironment() {
  const envPath = '.env.local';
  console.log(`\n🔧 Setting up local environment (${envPath})...\n`);

  if (!existsSync(envPath)) {
    console.log('Creating .env.local file...');
    writeFileSync(envPath, '');
  }

  const envContent = readFileSync(envPath, 'utf-8');

  if (!envContent.includes('MONITOR_ALERT_WEBHOOK_URL')) {
    console.log('\n📢 Webhook URL Setup');
    console.log('You can use one of these options:');
    console.log('1. Slack webhook: https://hooks.slack.com/services/...');
    console.log('2. Discord webhook: https://discord.com/api/webhooks/...');
    console.log('3. Test webhook: https://webhook.site/... (for testing)');
    console.log('4. Skip for now (press Enter)');

    const webhookUrl = await question('\nEnter your webhook URL: ');

    if (webhookUrl.trim()) {
      appendFileSync(envPath, `\n# Monitoring Alert Webhook\nMONITOR_ALERT_WEBHOOK_URL="${webhookUrl}"\n`);
      console.log('✅ Webhook URL added to .env.local');
    } else {
      console.log('⚠️  Skipped webhook configuration');
    }
  } else {
    console.log('✅ MONITOR_ALERT_WEBHOOK_URL already configured in .env.local');
  }
}

async function testAlertSystem() {
  console.log('\n🧪 Testing alert system...\n');

  const testScript = `
import { sendAlert } from '../lib/alerts/notify';

async function test() {
  const success = await sendAlert({
    title: '🧪 Test Alert',
    message: 'This is a test alert from the monitoring setup script',
    severity: 'info',
    context: {
      'Test Time': new Date().toISOString(),
      'Environment': 'local',
    }
  });

  if (success) {
    console.log('✅ Test alert sent successfully!');
    console.log('Check your webhook destination for the test message.');
  } else {
    console.log('⚠️ Alert not sent (webhook may not be configured)');
  }
}

test().catch(console.error);
  `;

  writeFileSync('/tmp/test-alert.ts', testScript);

  try {
    execSync('npx tsx /tmp/test-alert.ts', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to test alert system:', error);
  }
}

async function generateGitHubSecretsGuide() {
  console.log('\n📝 GitHub Secrets Configuration Guide\n');
  console.log('Run these commands to set up GitHub secrets for the repository:\n');

  const secrets = [
    { name: 'SUPABASE_URL', description: 'Your Supabase project URL' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Service role key with admin access' },
    { name: 'MONITOR_ALERT_WEBHOOK_URL', description: 'Webhook URL for monitoring alerts' },
    { name: 'DATABASE_URL', description: 'PostgreSQL connection string (optional)' }
  ];

  console.log('```bash');
  for (const secret of secrets) {
    console.log(`# ${secret.description}`);
    console.log(`gh secret set ${secret.name} --body "YOUR_${secret.name}_VALUE"\n`);
  }
  console.log('```\n');

  console.log('Or use the GitHub web interface:');
  console.log('1. Go to Settings → Secrets and variables → Actions');
  console.log('2. Click "New repository secret"');
  console.log('3. Add each secret listed above\n');
}

async function testMonitoringScripts() {
  console.log('\n🔍 Testing monitoring scripts...\n');

  const scripts = [
    { name: 'Telemetry Monitor', cmd: 'npm run monitor:telemetry' },
    { name: 'GDPR Monitor', cmd: 'npm run monitor:gdpr' }
  ];

  for (const script of scripts) {
    console.log(`Testing ${script.name}...`);
    try {
      execSync(script.cmd, { stdio: 'inherit', timeout: 10000 });
      console.log(`✅ ${script.name} passed\n`);
    } catch (error) {
      console.log(`⚠️  ${script.name} failed (may need database data)\n`);
    }
  }
}

async function testWorkflow() {
  console.log('\n🚀 Testing GitHub Workflow\n');

  const shouldTest = await question('Do you want to trigger the nightly workflow? (y/N): ');

  if (shouldTest.toLowerCase() === 'y') {
    console.log('Triggering workflow...');
    try {
      execSync('gh workflow run "Nightly Telemetry & GDPR Validation"', { stdio: 'inherit' });
      console.log('✅ Workflow triggered! Check GitHub Actions tab for progress.');
      console.log('View at: https://github.com/YOUR_REPO/actions');
    } catch (error) {
      console.log('❌ Failed to trigger workflow. Make sure:');
      console.log('1. GitHub CLI is installed and authenticated');
      console.log('2. You have permission to trigger workflows');
      console.log('3. The workflow file exists in .github/workflows/');
    }
  } else {
    console.log('Skipped workflow test');
  }
}

async function main() {
  console.log('🎯 Monitoring System Setup\n');
  console.log('This script will help you configure the monitoring and alerting system.\n');

  // Load environment variables
  config({ path: '.env.local' });

  // Check current environment
  const { missing } = await checkEnvironmentVariables();

  if (missing.length > 0) {
    console.log('\n⚠️  Some environment variables are missing.');
    const setup = await question('Would you like to set them up now? (Y/n): ');

    if (setup.toLowerCase() !== 'n') {
      await setupLocalEnvironment();
      // Reload environment
      config({ path: '.env.local' });
    }
  }

  // Test alert system
  const testAlerts = await question('\nTest the alert system? (Y/n): ');
  if (testAlerts.toLowerCase() !== 'n') {
    await testAlertSystem();
  }

  // Generate GitHub secrets guide
  await generateGitHubSecretsGuide();

  // Test monitoring scripts
  const testScripts = await question('Test monitoring scripts locally? (y/N): ');
  if (testScripts.toLowerCase() === 'y') {
    await testMonitoringScripts();
  }

  // Test workflow
  await testWorkflow();

  console.log('\n✨ Setup complete!\n');
  console.log('Next steps:');
  console.log('1. Configure GitHub secrets as shown above');
  console.log('2. Test the nightly workflow manually');
  console.log('3. Monitor webhook destination for alerts\n');

  rl.close();
}

main().catch((error) => {
  console.error('Setup failed:', error);
  rl.close();
  process.exit(1);
});