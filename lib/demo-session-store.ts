import { getRedisClient } from './redis';
import { createServiceRoleClient } from './supabase/server';
import { logger } from './logger';

export interface DemoSessionData {
  url: string;
  domain: string;
  pages: any[];
  chunks: string[];
  embeddings: number[][];
  metadata: any;
  created_at: number;
  expires_at: number;
  message_count: number;
  max_messages: number;
}

const SESSION_KEY_PREFIX = 'demo';
const DEFAULT_TTL_SECONDS = 600;
const REDIS_ENABLED = Boolean(process.env.REDIS_URL);

type MemorySession = {
  data: DemoSessionData;
  expiresAt: number;
};

const memoryStore: Map<string, MemorySession> = new Map();

function getSessionKey(sessionId: string): string {
  return `${SESSION_KEY_PREFIX}:${sessionId}:data`;
}

function getTtlSeconds(expiresAt: number): number {
  const diff = expiresAt - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) {
    return DEFAULT_TTL_SECONDS;
  }
  return Math.max(60, Math.floor(diff / 1000));
}

function saveInMemory(sessionId: string, data: DemoSessionData): void {
  memoryStore.set(sessionId, {
    data,
    expiresAt: data.expires_at,
  });
}

function readFromMemory(sessionId: string): DemoSessionData | null {
  const entry = memoryStore.get(sessionId);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(sessionId);
    return null;
  }

  return entry.data;
}

async function saveInRedis(sessionId: string, data: DemoSessionData): Promise<void> {
  try {
    const redis = await getRedisClient();
    const ttlSeconds = getTtlSeconds(data.expires_at);
    await redis.setex(getSessionKey(sessionId), ttlSeconds, JSON.stringify(data));
  } catch (error) {
    logger.error('[DemoSessionStore] Failed to save session to Redis', error as Error);
    saveInMemory(sessionId, data);
  }
}

async function readFromRedis(sessionId: string): Promise<DemoSessionData | null> {
  try {
    const redis = await getRedisClient();
    const raw = await redis.get(getSessionKey(sessionId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as DemoSessionData;
  } catch (error) {
    logger.error('[DemoSessionStore] Failed to read session from Redis', error as Error);
    return readFromMemory(sessionId);
  }
}

async function deleteFromRedis(sessionId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del(getSessionKey(sessionId));
  } catch (error) {
    logger.warn('[DemoSessionStore] Failed to delete session from Redis', error as Error);
  }
}

async function saveInSupabase(sessionId: string, data: DemoSessionData): Promise<void> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    logger.warn('[DemoSessionStore] Supabase unavailable, using in-memory store');
    saveInMemory(sessionId, data);
    return;
  }

  const { error } = await supabase
    .from('demo_sessions')
    .upsert({
      session_id: sessionId,
      domain: data.domain,
      session_data: data,
      message_count: data.message_count,
      max_messages: data.max_messages,
      expires_at: new Date(data.expires_at).toISOString(),
    });

  if (error) {
    logger.error('[DemoSessionStore] Failed to persist session to Supabase', error);
    saveInMemory(sessionId, data);
  }
}

async function readFromSupabase(sessionId: string): Promise<DemoSessionData | null> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return readFromMemory(sessionId);
  }

  const { data, error } = await supabase
    .from('demo_sessions')
    .select('session_data, message_count, max_messages, expires_at')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) {
    logger.error('[DemoSessionStore] Failed to read session from Supabase', error);
    return readFromMemory(sessionId);
  }

  if (!data) {
    return null;
  }

  const expiresAt = new Date(data.expires_at).getTime();
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    await deleteDemoSession(sessionId);
    return null;
  }

  const sessionData = data.session_data as DemoSessionData;
  sessionData.message_count = data.message_count ?? sessionData.message_count ?? 0;
  sessionData.max_messages = data.max_messages ?? sessionData.max_messages ?? 20;
  sessionData.expires_at = Math.min(
    sessionData.expires_at ?? expiresAt,
    expiresAt,
  );

  return sessionData;
}

async function deleteFromSupabase(sessionId: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    memoryStore.delete(sessionId);
    return;
  }

  const { error } = await supabase
    .from('demo_sessions')
    .delete()
    .eq('session_id', sessionId);

  if (error) {
    logger.warn('[DemoSessionStore] Failed to delete session from Supabase', error);
  }
}

export async function saveDemoSession(sessionId: string, data: DemoSessionData): Promise<void> {
  if (REDIS_ENABLED) {
    await saveInRedis(sessionId, data);
    return;
  }

  await saveInSupabase(sessionId, data);
}

export async function getDemoSession(sessionId: string): Promise<DemoSessionData | null> {
  if (REDIS_ENABLED) {
    return readFromRedis(sessionId);
  }

  return readFromSupabase(sessionId);
}

export async function deleteDemoSession(sessionId: string): Promise<void> {
  memoryStore.delete(sessionId);

  if (REDIS_ENABLED) {
    await deleteFromRedis(sessionId);
    return;
  }

  await deleteFromSupabase(sessionId);
}
