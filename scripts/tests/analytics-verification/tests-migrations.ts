import { MIGRATION_FILES } from './config';
import { fileExists, fileSizeKB } from './fs-helpers';
import type { TestResult } from './types';
import path from 'path';

export function testMigrations(): TestResult {
  console.log('\n5️⃣  DATABASE MIGRATIONS');
  console.log('-'.repeat(70));

  let migrationsFound = 0;
  const missing: string[] = [];

  for (const migration of MIGRATION_FILES) {
    if (fileExists(migration)) {
      migrationsFound++;
      const sizeKB = fileSizeKB(migration);
      console.log(`   ✅ ${path.basename(migration)} (${sizeKB} KB)`);
    } else {
      console.log(`   ❌ ${path.basename(migration)}`);
      missing.push(migration);
    }
  }

  return {
    feature: 'Database Migrations',
    status: missing.length === 0 ? '✅' : '⚠️',
    details: `${migrationsFound}/${MIGRATION_FILES.length} migrations found`,
    issues: missing.length > 0 ? missing : undefined
  };
}
