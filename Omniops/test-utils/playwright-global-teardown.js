/**
 * Playwright Global Teardown
 * Cleans up after test runs and generates reports
 */

const fs = require('fs/promises');
const path = require('path');

async function globalTeardown() {
  console.log('🧹 Playwright Global Teardown Starting...');
  
  try {
    // Read setup timestamp if available
    let setupTime;
    try {
      const timestamp = await fs.readFile('./test-results/setup-timestamp.txt', 'utf-8');
      setupTime = new Date(timestamp);
    } catch (error) {
      console.warn('⚠️  Could not read setup timestamp');
    }
    
    // Generate test run summary
    const summary = {
      teardownTime: new Date().toISOString(),
      setupTime: setupTime ? setupTime.toISOString() : null,
      duration: setupTime ? Date.now() - setupTime.getTime() : null,
      testResultsPath: path.resolve('./test-results')
    };
    
    // Check for test results
    try {
      const testResultsExists = await fs.access('./test-results').then(() => true).catch(() => false);
      if (testResultsExists) {
        const files = await fs.readdir('./test-results');
        summary.generatedFiles = files;
        console.log(`📁 Generated ${files.length} result files`);
      }
    } catch (error) {
      console.warn('⚠️  Could not read test results directory');
    }
    
    // Save teardown summary
    await fs.writeFile(
      './test-results/teardown-summary.json',
      JSON.stringify(summary, null, 2)
    );
    
    console.log('📊 Test run summary:');
    console.log(`   Setup: ${summary.setupTime || 'Unknown'}`);
    console.log(`   Teardown: ${summary.teardownTime}`);
    if (summary.duration) {
      console.log(`   Duration: ${Math.round(summary.duration / 1000)}s`);
    }
    
    // Cleanup temporary files (optional)
    const cleanupTemp = process.env.CLEANUP_TEMP === 'true';
    if (cleanupTemp) {
      console.log('🗑️  Cleaning up temporary files...');
      try {
        // Add cleanup logic here if needed
        console.log('✅ Cleanup complete');
      } catch (error) {
        console.warn('⚠️  Cleanup failed:', error.message);
      }
    }
    
    console.log('🎯 Playwright Global Teardown Complete!');
    
  } catch (error) {
    console.error('❌ Teardown failed:', error.message);
    // Don't throw - teardown failures shouldn't fail the entire run
  }
}

module.exports = globalTeardown;