// Mock for @/lib/supabase/server
// This mock is automatically loaded via Jest's moduleNameMapper

// Re-export the mock from @/lib/supabase-server which is set up in jest.setup.js
// This ensures both import paths use the same mock instance
export * from '@/lib/supabase-server';
