import { API_ROUTES } from './config';
import { fileExists } from './fs-helpers';
import type { TestResult } from './types';

export function testApiEndpoints(): TestResult {
  console.log('\n3️⃣  API ENDPOINTS');
  console.log('-'.repeat(70));

  let routesFound = 0;
  const missing: string[] = [];

  for (const route of API_ROUTES) {
    if (fileExists(route)) {
      routesFound++;
      console.log(`   ✅ ${route}`);
    } else {
      console.log(`   ❌ ${route}`);
      missing.push(route);
    }
  }

  return {
    feature: 'API Endpoints',
    status: missing.length === 0 ? '✅' : '⚠️',
    details: `${routesFound}/${API_ROUTES.length} routes found`,
    issues: missing.length > 0 ? missing : undefined
  };
}
