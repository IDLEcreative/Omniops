/**
 * Privacy Data Export Helpers
 * Functions for exporting user data in compliance with GDPR Article 20
 * (Right to Data Portability)
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

export interface UserDataExport {
  profile: {
    id: string;
    email?: string;
    name?: string;
    created_at?: string;
  };
  conversations: Array<{
    id: string;
    created_at: string;
    message_count: number;
  }>;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    created_at: string;
  }>;
  settings?: Record<string, any>;
  agreements?: Array<{
    type: string;
    accepted_at: string;
  }>;
}

/**
 * Fetch all user profile data
 */
export async function fetchUserProfile(userId: string) {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database unavailable');

  const { data, error } = await supabase
    .from('auth.users')
    .select('id, email, created_at, raw_user_meta_data')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    id: data?.id || userId,
    email: data?.email,
    name: data?.raw_user_meta_data?.name,
    created_at: data?.created_at,
  };
}

/**
 * Fetch all conversations for a user
 */
export async function fetchConversations(userId: string) {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database unavailable');

  const { data, error } = await supabase
    .from('conversations')
    .select('id, created_at, messages(count)')
    .eq('user_id', userId);

  if (error) throw error;

  return (data || []).map(conv => ({
    id: conv.id,
    created_at: conv.created_at,
    message_count: conv.messages?.[0]?.count || 0,
  }));
}

/**
 * Fetch all messages for a user
 */
export async function fetchMessages(userId: string) {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database unavailable');

  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at, conversation_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data || [];
}

/**
 * Fetch user settings/configuration
 */
export async function fetchSettings(userId: string) {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database unavailable');

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data || {};
}

/**
 * Fetch terms agreements
 */
export async function fetchAgreements(userId: string) {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database unavailable');

  const { data, error } = await supabase
    .from('terms_acceptances')
    .select('terms_version as type, accepted_at')
    .eq('user_id', userId);

  if (error) throw error;

  return data || [];
}

/**
 * Log data export for compliance audit
 */
export async function logDataExport(
  userId: string,
  metadata: Record<string, any>
) {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database unavailable');

  const { error } = await supabase.from('data_export_logs').insert({
    user_id: userId,
    exported_at: new Date().toISOString(),
    metadata,
  });

  if (error) throw error;
}
