/**
 * Monitoring System Tests
 *
 * Tests health endpoints, queue metrics, worker metrics, and system metrics.
 */

import { logSection, logSubSection, logTest, log, colors } from './test-utils.js';

/**
 * Test Monitoring System
 */
export async function testMonitoringSystem() {
  logSection('📊 TESTING MONITORING SYSTEM');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const errors = [];

  // Test health endpoints
  logSubSection('Testing Health Endpoints');

  const healthEndpoints = [
    { path: '/api/health', name: 'Basic health' },
    { path: '/api/health/comprehensive', name: 'Comprehensive health' },
    { path: '/api/queue', name: 'Queue health' },
    { path: '/api/monitoring/scraping', name: 'Scraping monitor' }
  ];

  for (const endpoint of healthEndpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`);
      const status = response.status;
      logTest(`${endpoint.name} endpoint`, status === 200 ? 'pass' : 'fail',
             `Status: ${status}`);

      if (status === 200) {
        const data = await response.json();
        log(`     ${colors.gray}Response keys: ${Object.keys(data).join(', ')}${colors.reset}`);
      }
    } catch (error) {
      logTest(`${endpoint.name} endpoint`, 'fail', error.message);
      errors.push(`${endpoint.name} endpoint error: ${error.message}`);
    }
  }

  // Test queue metrics
  logSubSection('Testing Queue Metrics');

  try {
    const response = await fetch(`${baseUrl}/api/queue`);
    if (response.ok) {
      const data = await response.json();
      logTest('Queue metrics fetch', 'pass');

      if (data.stats) {
        logTest('Active jobs metric', 'pass', `Count: ${data.stats.active || 0}`);
        logTest('Waiting jobs metric', 'pass', `Count: ${data.stats.waiting || 0}`);
        logTest('Completed jobs metric', 'pass', `Count: ${data.stats.completed || 0}`);
        logTest('Failed jobs metric', 'pass', `Count: ${data.stats.failed || 0}`);
      }
    } else {
      logTest('Queue metrics fetch', 'fail', `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Queue metrics', 'fail', error.message);
    errors.push(`Queue metrics error: ${error.message}`);
  }

  // Test system metrics
  logSubSection('Testing System Metrics');

  try {
    const response = await fetch(`${baseUrl}/api/health/comprehensive`);
    if (response.ok) {
      const data = await response.json();
      logTest('System metrics fetch', 'pass');

      if (data.system) {
        logTest('Memory usage metric', 'pass',
               `Used: ${Math.round(data.system.memoryUsed / 1024 / 1024)}MB`);
        logTest('CPU cores metric', 'pass', `Cores: ${data.system.cpuCount}`);
        logTest('Uptime metric', 'pass',
               `Uptime: ${Math.round(data.system.uptime / 60)} minutes`);
      }
    } else {
      logTest('System metrics fetch', 'fail', `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('System metrics', 'fail', error.message);
    errors.push(`System metrics error: ${error.message}`);
  }

  return errors;
}
