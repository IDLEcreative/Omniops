/**
 * Jest Environment Variables
 * Sets up environment variables for testing
 */

// Test environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Disable real API calls during testing
process.env.DISABLE_REAL_REQUESTS = 'true'

// Memory and performance settings for tests
process.env.NODE_OPTIONS = '--max-old-space-size=4096'

console.log('📋 Test environment variables loaded')