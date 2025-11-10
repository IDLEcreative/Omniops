import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const REQUIRED_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

export function ensureEnv(): { supabaseUrl: string; supabaseServiceKey: string } {
  const missing = REQUIRED_ENV.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  };
}
