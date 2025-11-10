import { API_BASE_URL, TEST_DOMAINS } from './config';
import { log, logSection, logSuccess, logError, logWarning } from './logger';
import { makeRequest } from './http';
import { runCustomerFlow } from './flows';

async function checkApiHealth() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/customer/config`);
      if (response.statusCode && response.statusCode < 400) {
        logSuccess('API server is accessible');
        return true;
      }
    } catch {
      if (attempt === 3) {
        logError(`Cannot connect to API server at ${API_BASE_URL}`);
        return false;
      }
    }
    logWarning(`Health check attempt ${attempt} failed, retrying...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return false;
}

export async function runCustomerFlowTests() {
  console.clear();
  log('Customer Service Agent - Onboarding Flow Test', 'bright');
  logSection('SYSTEM HEALTH CHECK');
  const healthy = await checkApiHealth();
  if (!healthy) {
    process.exit(1);
  }

  const results: Array<{ domain: string; success: boolean }> = [];
  for (const domain of TEST_DOMAINS) {
    const success = await runCustomerFlow(domain);
    results.push({ domain, success });
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logSection('TEST SUMMARY');
  const successful = results.filter(r => r.success).length;
  log(`Total domains tested: ${results.length}`);
  log(`Successful flows: ${successful}`);
  log(`Failed flows: ${results.length - successful}`);

  results.forEach(result => log(`${result.success ? '✓' : '✗'} ${result.domain}`, result.success ? 'green' : 'red'));
}
