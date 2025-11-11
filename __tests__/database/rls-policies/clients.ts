import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from './config';

export const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
export const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
