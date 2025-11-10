import { createServiceRoleClient } from '@/lib/supabase-server';

export async function getServiceClient() {
  return createServiceRoleClient();
}
