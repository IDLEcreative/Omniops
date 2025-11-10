import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ensureEnv } from './config';

export function createSupabaseClient() {
  ensureEnv();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function createOpenAIClient() {
  ensureEnv();
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
  });
}
