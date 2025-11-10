import { LIB_FILES } from './config';
import { fileExists, fileSizeKB } from './fs-helpers';
import type { TestResult } from './types';

export function testLibraryFiles(): TestResult {
  console.log('\n4️⃣  LIBRARY FILES');
  console.log('-'.repeat(70));

  let libsFound = 0;
  const missing: string[] = [];

  for (const lib of LIB_FILES) {
    if (fileExists(lib)) {
      libsFound++;
      const sizeKB = fileSizeKB(lib);
      console.log(`   ✅ ${lib} (${sizeKB} KB)`);
    } else {
      console.log(`   ❌ ${lib}`);
      missing.push(lib);
    }
  }

  return {
    feature: 'Library Files',
    status: missing.length === 0 ? '✅' : '⚠️',
    details: `${libsFound}/${LIB_FILES.length} libraries found`,
    issues: missing.length > 0 ? missing : undefined
  };
}
