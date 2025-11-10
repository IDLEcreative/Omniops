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

// Check if Redis is actually available (not just if URL is set)
async function isRedisAvailable(): Promise<boolean> {
  if (!process.env.REDIS_URL) {
    return false;
  }

  try {
    const redis = await getRedisClient();
    // Check if we're using the fallback client
    if ('isUsingFallback' in redis && typeof redis.isUsingFallback === 'function') {
      return !redis.isUsingFallback();
    }
    // For regular Redis clients, assume it's available if we got this far
    return true;
  } catch (error) {
    logger.error('[DemoSessionStore] Error checking Redis availability', error as Error);
    return false;
  }
}

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
    const key = getSessionKey(sessionId);

    logger.info('[DemoSessionStore] saveInRedis details', {
      sessionId,
      key,
      ttlSeconds,
      dataSize: JSON.stringify(data).length
    });

    await redis.setex(key, ttlSeconds, JSON.stringify(data));

    // Verify the save by reading it back
    const verification = await redis.get(key);
    logger.info('[DemoSessionStore] Redis save verification', {
      sessionId,
      key,
      saved: verification !== null,
      verificationDataLength: verification?.length || 0
    });
  } catch (error) {
    logger.error('[DemoSessionStore] Failed to save session to Redis', error as Error);
    logger.info('[DemoSessionStore] Falling back to in-memory storage', { sessionId });
    saveInMemory(sessionId, data);
  }
}

async function readFromRedis(sessionId: string): Promise<DemoSessionData | null> {
  try {
    const redis = await getRedisClient();
    const key = getSessionKey(sessionId);

    logger.info('[DemoSessionStore] readFromRedis details', {
      sessionId,
      key
    });

    const raw = await redis.get(key);

    logger.info('[DemoSessionStore] Redis read raw result', {
      sessionId,
      key,
      found: raw !== null,
      rawDataLength: raw?.length || 0
    });

    if (!raw) {
      logger.warn('[DemoSessionStore] Session not found in Redis, checking memory', { sessionId });
      return readFromMemory(sessionId);
    }

    const parsed = JSON.parse(raw) as DemoSessionData;
    logger.info('[DemoSessionStore] Successfully parsed session from Redis', {
      sessionId,
      domain: parsed.domain,
      expiresAt: new Date(parsed.expires_at).toISOString(),
      isExpired: parsed.expires_at <= Date.now()
    });

    return parsed;
  } catch (error) {
    logger.error('[DemoSessionStore] Failed to read session from Redis', error as Error);
    logger.info('[DemoSessionStore] Falling back to memory storage', { sessionId });
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
  logger.info('[DemoSessionStore] saveInSupabase called', { sessionId, domain: data.domain });

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    logger.warn('[DemoSessionStore] Supabase unavailable, using in-memory store');
    saveInMemory(sessionId, data);
    return;
  }

  logger.info('[DemoSessionStore] Upserting to demo_sessions table', {
    sessionId,
    domain: data.domain,
    expiresAt: new Date(data.expires_at).toISOString()
  });

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
    logger.info('[DemoSessionStore] Falling back to in-memory storage', { sessionId });
    saveInMemory(sessionId, data);
  } else {
    logger.info('[DemoSessionStore] Successfully saved to Supabase', { sessionId });
  }
}

async function readFromSupabase(sessionId: string): Promise<DemoSessionData | null> {
  logger.info('[DemoSessionStore] readFromSupabase called', { sessionId });

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    logger.warn('[DemoSessionStore] Supabase unavailable, checking memory', { sessionId });
    return readFromMemory(sessionId);
  }

  logger.info('[DemoSessionStore] Querying demo_sessions table', { sessionId });

  const { data, error } = await supabase
    .from('demo_sessions')
    .select('session_data, message_count, max_messages, expires_at')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) {
    logger.error('[DemoSessionStore] Failed to read session from Supabase', error);
    logger.info('[DemoSessionStore] Falling back to memory storage', { sessionId });
    return readFromMemory(sessionId);
  }

  if (!data) {
    logger.warn('[DemoSessionStore] Session not found in Supabase', { sessionId });
    return null;
  }

  logger.info('[DemoSessionStore] Found session in Supabase', {
    sessionId,
    expiresAt: data.expires_at,
    messageCount: data.message_count
  });

  const expiresAt = new Date(data.expires_at).getTime();
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    logger.warn('[DemoSessionStore] Session expired in Supabase, deleting', {
      sessionId,
      expiresAt: new Date(data.expires_at).toISOString(),
      now: new Date().toISOString()
    });
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

  logger.info('[DemoSessionStore] Successfully parsed session from Supabase', {
    sessionId,
    domain: sessionData.domain
  });

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
  const redisAvailable = await isRedisAvailable();

  logger.info('[DemoSessionStore] saveDemoSession called', {
    sessionId,
    redisAvailable,
    hasRedisUrl: Boolean(process.env.REDIS_URL),
    expiresAt: new Date(data.expires_at).toISOString(),
    domain: data.domain
  });

  if (redisAvailable) {
    logger.info('[DemoSessionStore] Saving to Redis', { sessionId });
    await saveInRedis(sessionId, data);
    logger.info('[DemoSessionStore] Successfully saved to Redis', { sessionId });
    return;
  }

  logger.info('[DemoSessionStore] Saving to Supabase (Redis disabled)', { sessionId });
  await saveInSupabase(sessionId, data);
  logger.info('[DemoSessionStore] Successfully saved to Supabase', { sessionId });
}

export async function getDemoSession(sessionId: string): Promise<DemoSessionData | null> {
  const redisAvailable = await isRedisAvailable();

  logger.info('[DemoSessionStore] getDemoSession called', {
    sessionId,
    redisAvailable,
    hasRedisUrl: Boolean(process.env.REDIS_URL)
  });

  if (redisAvailable) {
    logger.info('[DemoSessionStore] Reading from Redis', { sessionId });
    const result = await readFromRedis(sessionId);
    logger.info('[DemoSessionStore] Redis read result', {
      sessionId,
      found: result !== null,
      domain: result?.domain
    });
    return result;
  }

  logger.info('[DemoSessionStore] Reading from Supabase (Redis disabled)', { sessionId });
  const result = await readFromSupabase(sessionId);
  logger.info('[DemoSessionStore] Supabase read result', {
    sessionId,
    found: result !== null,
    domain: result?.domain
  });
  return result;
}

export async function deleteDemoSession(sessionId: string): Promise<void> {
  memoryStore.delete(sessionId);

  const redisAvailable = await isRedisAvailable();

  if (redisAvailable) {
    await deleteFromRedis(sessionId);
    return;
  }

  await deleteFromSupabase(sessionId);
}
