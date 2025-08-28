/**
 * Global Teardown for Integration Tests
 * Runs once after all tests complete
 */

module.exports = async () => {
  console.log('🧹 Cleaning up integration test environment...')
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  // Clear any remaining timers
  if (global.clearImmediate) {
    global.clearImmediate()
  }
  
  // Allow process to exit cleanly
  process.nextTick(() => {
    process.exit(0)
  })
  
  console.log('✅ Global teardown complete')
}