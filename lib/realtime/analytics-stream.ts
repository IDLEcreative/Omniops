import { createServiceRoleClientSync } from '@/lib/supabase/server';
import { EventEmitter } from 'events';

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  session_id?: string;
  conversation_id?: string;
  domain_id?: string;
  data: Record<string, any>;
  created_at: string;
}

export interface StreamClient {
  id: string;
  response: ReadableStreamDefaultController;
  lastPing: number;
}

class AnalyticsStreamManager extends EventEmitter {
  private clients: Map<string, StreamClient> = new Map();
  private supabase: any;
  private subscription: any;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeSupabase();
    this.startPingInterval();
  }

  private initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createServiceRoleClientSync();
    if (!this.supabase) {
      throw new Error('Failed to create Supabase client');
    }
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    // Subscribe to real-time changes in analytics_events table
    this.subscription = this.supabase
      .channel('analytics_events_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events'
        },
        (payload: any) => {
          this.handleNewEvent(payload.new as AnalyticsEvent);
        }
      )
      .subscribe();
  }

  private handleNewEvent(event: AnalyticsEvent) {
    // Emit event to all connected clients
    this.broadcastToClients({
      type: 'event',
      data: event,
      timestamp: Date.now()
    });
  }

  private startPingInterval() {
    // Send ping every 30 seconds to keep connections alive
    this.pingInterval = setInterval(() => {
      this.broadcastToClients({
        type: 'ping',
        timestamp: Date.now()
      });
      this.cleanupStaleClients();
    }, 30000);
  }

  private cleanupStaleClients() {
    const now = Date.now();
    const staleThreshold = 60000; // 1 minute

    for (const [id, client] of this.clients) {
      if (now - client.lastPing > staleThreshold) {
        this.removeClient(id);
      }
    }
  }

  private broadcastToClients(data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`;

    for (const [id, client] of this.clients) {
      try {
        client.response.enqueue(new TextEncoder().encode(message));
        client.lastPing = Date.now();
      } catch (error) {
        // Client disconnected, remove from list
        this.removeClient(id);
      }
    }
  }

  public addClient(clientId: string, controller: ReadableStreamDefaultController) {
    this.clients.set(clientId, {
      id: clientId,
      response: controller,
      lastPing: Date.now()
    });

    // Send initial connection message
    const welcomeMessage = `data: ${JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: Date.now()
    })}\n\n`;

    controller.enqueue(new TextEncoder().encode(welcomeMessage));
  }

  public removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.response.close();
      } catch (error) {
        // Already closed
      }
      this.clients.delete(clientId);
    }
  }

  public async getRecentEvents(minutes: number = 5): Promise<AnalyticsEvent[]> {
    const { data, error } = await this.supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', new Date(Date.now() - minutes * 60000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent events:', error);
      return [];
    }

    return data || [];
  }

  public async recordEvent(
    eventType: string,
    sessionId?: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    const { error } = await this.supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        session_id: sessionId,
        data
      });

    if (error) {
      console.error('Error recording analytics event:', error);
    }
  }

  public destroy() {
    if (this.subscription && this.supabase) {
      try {
        this.supabase.removeChannel(this.subscription);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    for (const [id] of this.clients) {
      this.removeClient(id);
    }
  }
}

// Singleton instance
let streamManager: AnalyticsStreamManager | null = null;

export function getAnalyticsStreamManager(): AnalyticsStreamManager {
  if (!streamManager) {
    streamManager = new AnalyticsStreamManager();
  }
  return streamManager;
}

// Reset singleton for testing purposes only
export function resetAnalyticsStreamManager(): void {
  if (streamManager) {
    streamManager.destroy();
    streamManager = null;
  }
}

export function createAnalyticsStream(clientId: string): ReadableStream {
  const manager = getAnalyticsStreamManager();

  return new ReadableStream({
    start(controller) {
      manager.addClient(clientId, controller);
    },
    cancel() {
      manager.removeClient(clientId);
    }
  });
}