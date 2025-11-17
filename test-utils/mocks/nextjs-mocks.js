/**
 * Next.js Mocks Configuration
 *
 * Provides mock implementations for Next.js navigation, headers, and cookies.
 * Ensures tests can run without Next.js runtime environment.
 */

const routerMock = {
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
};

// IMPORTANT: Next.js 15 made cookies() async, so the mock must return a Promise
const headersMock = {
  cookies: jest.fn(async () => ({
    get: jest.fn((name) => {
      // Return Supabase auth cookies for authenticated tests
      if (name === 'sb-access-token' || name.startsWith('sb-')) {
        return { name, value: 'mock-access-token' };
      }
      return { name, value: 'mock-cookie-value' };
    }),
    getAll: jest.fn(() => [
      // Supabase SSR client expects these cookies for authentication
      { name: 'sb-access-token', value: 'mock-access-token' },
      { name: 'sb-refresh-token', value: 'mock-refresh-token' },
    ]),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn((name) => name.startsWith('sb-')),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
    set: jest.fn(),
    delete: jest.fn(),
    forEach: jest.fn(),
  })),
};

module.exports = {
  routerMock,
  headersMock,
};
