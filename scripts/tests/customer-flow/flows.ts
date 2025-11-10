import { API_BASE_URL } from './config';
import { log, logSection, logStep, logSuccess, logError, logWarning } from './logger';
import { makeRequest } from './http';

export async function testDomainValidation(domain: string) {
  logStep('VALIDATION', `Testing domain: ${domain}`);
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/customer/config/validate?domain=${domain}`);
    if (response.statusCode === 200) {
      const data = response.data;
      if (data.valid) {
        logSuccess(`Domain ${domain} is valid`);
        if (data.warnings) data.warnings.forEach((warning: string) => logWarning(warning));
      } else {
        logError(`Domain ${domain} invalid: ${data.error}`);
      }
      return data;
    }
    logError(`Validation failed with status ${response.statusCode}`);
    return null;
  } catch (error: any) {
    logError(`Validation request failed: ${error.message}`);
    return null;
  }
}

export async function createCustomerConfig(domain: string, customerId: string) {
  logStep('CONFIG', `Creating configuration for ${domain}`);
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/customer/config`, {
      method: 'POST',
      body: {
        domain,
        customerId,
        settings: { autoScrape: true, scrapingFrequency: 'weekly', priority: 'high', maxPages: 25, includeSubdomains: false },
        metadata: { testRun: true, testTimestamp: new Date().toISOString() }
      }
    });

    if (response.statusCode === 201) {
      logSuccess(`Configuration created with ID: ${response.data.config.id}`);
      return response.data.config;
    }

    if (response.statusCode === 409) {
      logWarning(`Domain already configured: ${response.data.existingConfigId}`);
      return response.data;
    }

    logError(`Configuration failed status ${response.statusCode}`);
    return null;
  } catch (error: any) {
    logError(`Configuration request failed: ${error.message}`);
    return null;
  }
}

export async function checkScrapeJobStatus(configId: string) {
  logStep('STATUS', `Checking jobs for config ${configId}`);
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/scrape-jobs?customer_config_id=${configId}`);
    if (response.statusCode === 200) {
      const jobs = response.data.data || [];
      jobs.forEach((job: any, index: number) => {
        log(`  Job ${index + 1} - Status: ${job.status}`, job.status === 'completed' ? 'green' : 'yellow');
      });
      return jobs;
    }
    logError(`Job status failed with ${response.statusCode}`);
    return [];
  } catch (error: any) {
    logError(`Job status request failed: ${error.message}`);
    return [];
  }
}

export async function monitorScrapeProgress(configId: string, maxWaitTime = 60000) {
  logStep('MONITOR', `Monitoring scrape (max ${maxWaitTime / 1000}s)`);
  const start = Date.now();
  while (Date.now() - start < maxWaitTime) {
    const jobs = await checkScrapeJobStatus(configId);
    const running = jobs.find(job => ['pending', 'running'].includes(job.status));
    if (!running) {
      return jobs.find(job => job.status === 'completed') || null;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  logWarning('Monitoring timeout reached');
  return null;
}

export async function getConfigurationStatus(configId: string) {
  const response = await makeRequest(`${API_BASE_URL}/api/customer/config?id=${configId}`);
  if (response.statusCode === 200) {
    const config = response.data.data?.[0];
    if (config) {
      logSuccess('Integration status retrieved');
    }
    return config;
  }
  logError(`Failed to get configuration status (${response.statusCode})`);
  return null;
}

export async function runCustomerFlow(domain: string) {
  logSection(`CUSTOMER FLOW: ${domain}`);
  const validation = await testDomainValidation(domain);
  if (!validation?.valid) return false;

  const config = await createCustomerConfig(domain, `test-customer-${Date.now()}`);
  if (!config?.id) return false;

  await monitorScrapeProgress(config.id, 30000);
  await getConfigurationStatus(config.id);

  logSuccess(`Flow completed for ${domain}`);
  return true;
}
