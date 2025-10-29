/**
 * WooCommerce Monitoring Report Generator
 * Generates comprehensive health reports
 */

import { MonitoringReport, HealthStatus } from './types';
import {
  checkDatabaseConnection,
  checkWooCommerceCredentials,
  checkWooCommerceAPI,
  checkProductSearch,
  checkChatEndpoint
} from './health-checks';

export async function generateReport(): Promise<MonitoringReport> {
  console.log('🔍 WooCommerce Integration Health Check');
  console.log('━'.repeat(70));
  console.log(`Started: ${new Date().toISOString()}\n`);

  const checks: HealthStatus[] = [];
  const recommendations: string[] = [];

  // Run all checks
  console.log('Running health checks...\n');

  checks.push(await checkDatabaseConnection());
  checks.push(await checkWooCommerceCredentials());
  checks.push(await checkWooCommerceAPI());
  checks.push(await checkProductSearch());
  checks.push(await checkChatEndpoint());

  // Calculate overall status
  const downCount = checks.filter((c) => c.status === 'down').length;
  const degradedCount = checks.filter((c) => c.status === 'degraded').length;

  let overallStatus: 'healthy' | 'degraded' | 'down';
  if (downCount > 0) {
    overallStatus = 'down';
  } else if (degradedCount > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  // Calculate metrics
  const apiCheck = checks.find((c) => c.component === 'WooCommerce API');
  const dbCheck = checks.find((c) => c.component === 'Database Connection');

  const metrics = {
    apiResponseTime: apiCheck?.responseTime || 0,
    databaseResponseTime: dbCheck?.responseTime || 0
  };

  // Generate recommendations
  if (overallStatus === 'down') {
    recommendations.push('🚨 CRITICAL: One or more components are down. Immediate action required.');
  }

  if (metrics.apiResponseTime > 2000) {
    recommendations.push('⚠️  API response time is slow (>2s). Consider caching or optimizing queries.');
  }

  if (degradedCount > 0) {
    recommendations.push('⚠️  Some components are degraded. Monitor closely and investigate issues.');
  }

  if (overallStatus === 'healthy') {
    recommendations.push('✅ All systems operational. Continue monitoring.');
  }

  // Check for specific issues
  const credCheck = checks.find((c) => c.component === 'WooCommerce Credentials');
  if (credCheck?.status === 'degraded' && credCheck.details?.includes('env vars')) {
    recommendations.push('💡 Consider storing credentials in database for better multi-tenant support.');
  }

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    checks,
    metrics,
    recommendations
  };
}
