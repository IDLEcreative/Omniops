// Environment variable validation
const requiredEnvVars = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // AI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
} as const;

export function checkEnvVars() {
  const missing: string[] = [];
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env.local file');
    
    // In development, log helpful message
    if (process.env.NODE_ENV === 'development') {
      console.error('\nHint: Copy .env.local.example to .env.local and fill in your values');
    }
    
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ All required environment variables are set');
}

// Validate on import (server-side only)
if (typeof window === 'undefined') {
  try {
    checkEnvVars();
  } catch (error) {
    console.error('Environment check failed:', error);
    // Don't crash in production, just log
    if (process.env.NODE_ENV === 'production') {
      console.error('WARNING: Running with missing environment variables');
    } else {
      // Re-throw in development
      throw error;
    }
  }
}