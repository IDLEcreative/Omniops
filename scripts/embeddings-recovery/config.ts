import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY'
] as const;

export function ensureEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const CONFIG = {
  BATCH_SIZE: parseInt(process.env.EMBEDDING_BATCH_SIZE || '5'),
  CHUNK_SIZE: parseInt(process.env.EMBEDDING_CHUNK_SIZE || '1000'),
  DELAY_BETWEEN_BATCHES: parseInt(process.env.EMBEDDING_DELAY_MS || '2000'),
  OPENAI_BATCH_SIZE: parseInt(process.env.OPENAI_BATCH_SIZE || '10'),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
  RETRY_DELAY_MS: parseInt(process.env.RETRY_DELAY_MS || '1000')
};
