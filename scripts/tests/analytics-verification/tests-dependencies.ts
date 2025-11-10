import { REQUIRED_DEPENDENCIES } from './config';
import { readPackageJson } from './fs-helpers';
import type { TestResult } from './types';

export function testDependencies(): TestResult {
  console.log('\n6️⃣  NPM DEPENDENCIES');
  console.log('-'.repeat(70));

  const pkg = readPackageJson();
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  let depsFound = 0;
  const missing: string[] = [];

  for (const [dep, purpose] of Object.entries(REQUIRED_DEPENDENCIES)) {
    if (allDeps?.[dep]) {
      depsFound++;
      console.log(`   ✅ ${dep} (${allDeps[dep]}) - ${purpose}`);
    } else {
      console.log(`   ❌ ${dep} - ${purpose}`);
      missing.push(`${dep} (${purpose})`);
    }
  }

  return {
    feature: 'NPM Dependencies',
    status: missing.length === 0 ? '✅' : '⚠️',
    details: `${depsFound}/${Object.keys(REQUIRED_DEPENDENCIES).length} dependencies found`,
    issues: missing.length > 0 ? missing : undefined
  };
}
