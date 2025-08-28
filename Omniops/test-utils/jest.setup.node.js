// Setup for Node environment tests (API routes, server-side code)

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long'
process.env.WOOCOMMERCE_URL = 'https://test-store.com'
process.env.WOOCOMMERCE_CONSUMER_KEY = 'test-consumer-key'
process.env.WOOCOMMERCE_CONSUMER_SECRET = 'test-consumer-secret'

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})