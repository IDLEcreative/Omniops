import { createServiceClient } from '@/lib/supabase/server';

interface CachedMetric {
  value: any;
  timestamp: number;
  ttl: number;
}

interface ResponseTimeMetrics {
  p50: number;
  p95: number;
  p99: number;
}

interface SessionMetrics {
  activeCount: number;
  avgDuration: number;
  avgMessageCount: number;
}

class MetricsCache {
  private cache: Map<string, CachedMetric> = new Map();

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  set(key: string, value: any, ttl: number = 10000) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }
}

const metricsCache = new MetricsCache();

function getSupabaseClient() {
  return createServiceClient();
}

export async function getActiveSessionsCount(): Promise<number> {
  const cacheKey = 'active_sessions_count';
  const cached = metricsCache.get(cacheKey);
  if (cached !== null) return cached;

  const supabase = getSupabaseClient();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();

  // Count unique sessions that had activity in last 5 minutes
  const { data, error } = await supabase
    .from('analytics_events')
    .select('session_id')
    .gte('created_at', fiveMinutesAgo)
    .not('session_id', 'is', null);

  if (error) {
    console.error('Error fetching active sessions:', error);
    return 0;
  }

  const uniqueSessions = new Set(data?.map(d => d.session_id) || []);
  const count = uniqueSessions.size;

  metricsCache.set(cacheKey, count);
  return count;
}

export async function getMessagesPerMinute(): Promise<number> {
  const cacheKey = 'messages_per_minute';
  const cached = metricsCache.get(cacheKey);
  if (cached !== null) return cached;

  const supabase = getSupabaseClient();
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

  const { count, error } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .in('event_type', ['message_sent', 'message_received'])
    .gte('created_at', oneMinuteAgo);

  if (error) {
    console.error('Error fetching messages per minute:', error);
    return 0;
  }

  const messagesCount = count || 0;
  metricsCache.set(cacheKey, messagesCount, 5000); // Cache for 5 seconds
  return messagesCount;
}

export async function getResponseTimes(): Promise<ResponseTimeMetrics> {
  const cacheKey = 'response_times';
  const cached = metricsCache.get(cacheKey);
  if (cached !== null) return cached;

  const supabase = getSupabaseClient();
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  // Get response_completed events with response_time_ms
  const { data, error } = await supabase
    .from('analytics_events')
    .select('data')
    .eq('event_type', 'response_completed')
    .gte('created_at', oneHourAgo)
    .not('data->response_time_ms', 'is', null);

  if (error || !data || data.length === 0) {
    console.error('Error fetching response times:', error);
    return { p50: 0, p95: 0, p99: 0 };
  }

  // Extract response times and sort
  const responseTimes = data
    .map(d => d.data?.response_time_ms)
    .filter(t => typeof t === 'number')
    .sort((a, b) => a - b);

  if (responseTimes.length === 0) {
    return { p50: 0, p95: 0, p99: 0 };
  }

  // Calculate percentiles
  const p50Index = Math.floor(responseTimes.length * 0.5);
  const p95Index = Math.floor(responseTimes.length * 0.95);
  const p99Index = Math.floor(responseTimes.length * 0.99);

  const metrics: ResponseTimeMetrics = {
    p50: responseTimes[p50Index] || 0,
    p95: responseTimes[p95Index] || 0,
    p99: responseTimes[p99Index] || 0
  };

  metricsCache.set(cacheKey, metrics);
  return metrics;
}

export async function getUserEngagementMetrics(): Promise<SessionMetrics> {
  const cacheKey = 'user_engagement';
  const cached = metricsCache.get(cacheKey);
  if (cached !== null) return cached;

  const supabase = getSupabaseClient();
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  // Get session start and end events
  const { data: sessionData, error: sessionError } = await supabase
    .from('analytics_events')
    .select('*')
    .in('event_type', ['session_started', 'session_ended', 'message_sent'])
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: true });

  if (sessionError || !sessionData) {
    console.error('Error fetching engagement metrics:', sessionError);
    return {
      activeCount: 0,
      avgDuration: 0,
      avgMessageCount: 0
    };
  }

  // Group by session
  const sessionMap = new Map<string, any[]>();
  sessionData.forEach(event => {
    if (event.session_id) {
      if (!sessionMap.has(event.session_id)) {
        sessionMap.set(event.session_id, []);
      }
      sessionMap.get(event.session_id)!.push(event);
    }
  });

  // Calculate metrics
  let totalDuration = 0;
  let completedSessions = 0;
  let totalMessages = 0;

  sessionMap.forEach((events, sessionId) => {
    const startEvent = events.find(e => e.event_type === 'session_started');
    const endEvent = events.find(e => e.event_type === 'session_ended');
    const messageCount = events.filter(e => e.event_type === 'message_sent').length;

    totalMessages += messageCount;

    if (startEvent && endEvent) {
      const duration = new Date(endEvent.created_at).getTime() -
                      new Date(startEvent.created_at).getTime();
      totalDuration += duration;
      completedSessions++;
    }
  });

  const metrics: SessionMetrics = {
    activeCount: sessionMap.size,
    avgDuration: completedSessions > 0 ? totalDuration / completedSessions : 0,
    avgMessageCount: sessionMap.size > 0 ? totalMessages / sessionMap.size : 0
  };

  metricsCache.set(cacheKey, metrics);
  return metrics;
}

export async function getRecentActivityFeed(limit: number = 10) {
  const cacheKey = `activity_feed_${limit}`;
  const cached = metricsCache.get(cacheKey);
  if (cached !== null) return cached;

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity feed:', error);
    return [];
  }

  const activities = data || [];
  metricsCache.set(cacheKey, activities, 3000); // Cache for 3 seconds
  return activities;
}

export async function getAggregatedMetrics() {
  const [
    activeSessions,
    messagesPerMinute,
    responseTimes,
    engagement,
    activityFeed
  ] = await Promise.all([
    getActiveSessionsCount(),
    getMessagesPerMinute(),
    getResponseTimes(),
    getUserEngagementMetrics(),
    getRecentActivityFeed()
  ]);

  return {
    activeSessions,
    messagesPerMinute,
    responseTimes,
    engagement,
    activityFeed,
    timestamp: Date.now()
  };
}