/**
 * Global Setup for Integration Tests
 * Runs once before all tests
 */

module.exports = async () => {
  console.log('🔧 Setting up integration test environment...')
  
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.CI = 'true'
  
  // Disable real network calls
  process.env.DISABLE_REAL_REQUESTS = 'true'
  
  // Set memory limits for testing
  if (global.gc) {
    global.gc()
  }
  
  console.log('✅ Global setup complete')
}