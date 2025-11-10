import { COMPONENT_FILES } from './config';
import { fileExists } from './fs-helpers';
import type { TestResult } from './types';

export function testComponentFiles(): TestResult {
  console.log('\n2️⃣  REACT COMPONENTS & HOOKS');
  console.log('-'.repeat(70));

  let filesFound = 0;
  const missing: string[] = [];

  for (const file of COMPONENT_FILES) {
    if (fileExists(file)) {
      filesFound++;
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file}`);
      missing.push(file);
    }
  }

  return {
    feature: 'React Components & Hooks',
    status: missing.length === 0 ? '✅' : '⚠️',
    details: `${filesFound}/${COMPONENT_FILES.length} files found`,
    issues: missing.length > 0 ? missing : undefined
  };
}
