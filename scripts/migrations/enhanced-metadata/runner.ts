import { migrationParts } from './parts';
import { executeSqlDirect } from './executor';

export async function runEnhancedMetadataMigration() {
  console.log('🚀 Applying enhanced metadata search migration...\n');

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < migrationParts.length; i++) {
    const part = migrationParts[i];
    console.log(`📝 ${i + 1}/${migrationParts.length}: ${part.name}`);

    try {
      await executeSqlDirect(part.sql);
      console.log('   ✅ Success');
      successCount++;
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      failureCount++;
    }
    console.log('');
  }

  console.log(`🎉 Migration completed! ✅ ${successCount} succeeded, ❌ ${failureCount} failed`);
  if (failureCount > 0) {
    console.log('\nSome operations failed; verify functions/indexes manually.');
  }
}
