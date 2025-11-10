// Mock for @/lib/supabase/client
// Import the mocked createBrowserClient instead of the real one
const { createBrowserClient } = jest.requireActual('@supabase/ssr');

export function createClient() {
  return createBrowserClient(
    'https://test.supabase.co',
    'test-anon-key'
  );
}
