/**
 * Server health check for /api/admin/lookup-failures tests
 */

export async function checkServerHealth(baseUrl: string): Promise<boolean> {
  console.log('🔍 Checking server status...\n');

  for (let i = 1; i <= 6; i++) {
    try {
      const response = await fetch(baseUrl, { method: 'HEAD' });
      if (response.ok || response.status === 404) {
        console.log('✅ Server is responding on port 3000\n');
        return true;
      }
    } catch (error) {
      console.log(`Attempt ${i}/6: Server not ready, waiting...`);
      if (i < 6) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  console.log('❌ Server failed to respond after 6 attempts (1 minute)\n');
  return false;
}

export async function verifyDataAccuracy(baseUrl: string): Promise<{ passed: boolean; error?: string }> {
  console.log('🔍 Verifying Data Accuracy...\n');

  const url = `${baseUrl}/api/admin/lookup-failures?days=7`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log(`📊 Sample Data Analysis:`);
    console.log(`   Total Failures: ${data.stats.totalFailures}`);
    console.log(`   Error Types: ${Object.keys(data.stats.byErrorType).length} types`);
    console.log(`   Platforms: ${Object.keys(data.stats.byPlatform).length} platforms`);
    console.log(`   Top Failed Queries: ${data.stats.topFailedQueries.length} entries`);
    console.log(`   Common Patterns: ${data.stats.commonPatterns.length} patterns`);
    console.log(`   Period: ${data.period}`);
    console.log(`   Domain ID: ${data.domainId}\n`);

    return { passed: true };
  } catch (error) {
    console.log(`❌ Data accuracy check failed: ${error}\n`);
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
