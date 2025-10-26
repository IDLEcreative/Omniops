import { http, HttpResponse, passthrough } from 'msw'

/**
 * Supabase Authentication Mock Handlers
 *
 * Handles:
 * - Token authentication
 * - User signup
 * - User session management
 * - Admin user operations (with passthrough for RLS testing)
 * - Database operations (with passthrough for integration tests)
 */

export const authHandlers = [
  // Supabase Auth - Token endpoint
  http.post('*/auth/v1/token', () => {
    // For integration tests, let real Supabase handle authentication
    // For unit tests, this will be overridden with mocks
    return passthrough()
  }),

  // Supabase Auth Admin API - Allow passthrough for RLS testing
  http.post('*/auth/v1/admin/users', () => {
    // Let the request pass through to real Supabase for RLS tests
    return passthrough()
  }),

  http.delete('*/auth/v1/admin/users/*', () => {
    // Let the request pass through to real Supabase for RLS tests
    return passthrough()
  }),

  // Supabase Auth - User signup
  http.post('*/auth/v1/signup', async ({ request }) => {
    const body = await request.json() as { email: string; password?: string }
    return HttpResponse.json({
      user: {
        id: 'new-user-id',
        email: body.email,
        email_confirmed_at: null,
        created_at: new Date().toISOString()
      },
      session: null // Requires email confirmation
    })
  }),

  // Supabase Auth - Get current user
  http.get('*/auth/v1/user', () => {
    // Default to authenticated for tests (override in specific test cases)
    // Supabase SSR client doesn't send cookies in unit tests, so we can't rely on them
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      role: 'authenticated'
    })
  }),

  // Supabase Database mocks - Allow passthrough for integration tests
  // For RLS testing, we need real database calls
  http.all('*/rest/v1/*', () => {
    // Let requests pass through to real Supabase for integration tests
    // Unit tests can override with specific mocks if needed
    return passthrough()
  })
]
