/**
 * Persistent Message Queue
 *
 * Extends MessageQueue with optional Supabase persistence for offline message recovery.
 * Messages are stored both in-memory (for fast access) and in Supabase (for crash recovery).
 *
 * Use cases:
 * - Page reload recovery (messages persist across sessions)
 * - Browser crash recovery (messages restored on next visit)
 * - Network outage recovery (messages queued until reconnection)
 */

import { MessageQueue } from './message-queue';
import type { QueuedMessage } from './types';
import { createClient } from '@/lib/supabase/client';

export interface PersistentQueueOptions {
  maxQueueSize?: number;
  debug?: boolean;
  enablePersistence?: boolean; // Default: true
  customerId?: string;
  sessionId?: string;
  conversationId?: string;
}

export class PersistentMessageQueue extends MessageQueue {
  private enablePersistence: boolean;
  private customerId: string | null = null;
  private sessionId: string | null = null;
  private conversationId: string | null = null;
  private supabase: ReturnType<typeof createClient> | null = null;

  constructor(options: PersistentQueueOptions = {}) {
    super(options.maxQueueSize, options.debug);
    this.enablePersistence = options.enablePersistence ?? true;
    this.customerId = options.customerId ?? null;
    this.sessionId = options.sessionId ?? null;
    this.conversationId = options.conversationId ?? null;

    if (this.enablePersistence) {
      this.supabase = createClient();
    }
  }

  /**
   * Set customer context for persistence
   */
  setContext(customerId: string, sessionId: string, conversationId?: string): void {
    this.customerId = customerId;
    this.sessionId = sessionId;
    this.conversationId = conversationId ?? null;
  }

  /**
   * Add message to queue with optional persistence
   */
  async enqueue(message: QueuedMessage): Promise<void> {
    // Add to in-memory queue
    super.enqueue(message);

    // Optionally persist to Supabase
    if (this.enablePersistence && this.supabase && this.customerId && this.sessionId) {
      try {
        await this.persistMessage(message);
      } catch (error) {
        console.error('[PersistentMessageQueue] Failed to persist message:', error);
        // Don't throw - we want to continue even if persistence fails
      }
    }
  }

  /**
   * Persist a single message to Supabase
   */
  private async persistMessage(message: QueuedMessage): Promise<void> {
    if (!this.supabase || !this.customerId || !this.sessionId) {
      return;
    }

    const { error } = await this.supabase
      .from('message_queue')
      .insert({
        customer_id: this.customerId,
        session_id: this.sessionId,
        conversation_id: this.conversationId,
        message_data: message,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      });

    if (error) {
      throw error;
    }
  }

  /**
   * Load persisted messages from Supabase for current session
   */
  async loadPersistedMessages(): Promise<QueuedMessage[]> {
    if (!this.enablePersistence || !this.supabase || !this.customerId || !this.sessionId) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('message_queue')
        .select('message_data, id')
        .eq('customer_id', this.customerId)
        .eq('session_id', this.sessionId)
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Extract messages and add to in-memory queue
      const messages = data.map((row: any) => row.message_data as QueuedMessage);
      messages.forEach((msg: QueuedMessage) => super.enqueue(msg));

      return messages;
    } catch (error) {
      console.error('[PersistentMessageQueue] Failed to load persisted messages:', error);
      return [];
    }
  }

  /**
   * Mark message as processed in Supabase
   */
  async markMessageProcessed(message: QueuedMessage): Promise<void> {
    if (!this.enablePersistence || !this.supabase || !this.customerId || !this.sessionId) {
      return;
    }

    try {
      const { error } = await this.supabase
        .from('message_queue')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('customer_id', this.customerId)
        .eq('session_id', this.sessionId)
        .eq('message_data->key', message.key)
        .eq('message_data->timestamp', message.timestamp);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('[PersistentMessageQueue] Failed to mark message as processed:', error);
      // Don't throw - we want to continue even if update fails
    }
  }

  /**
   * Mark message as failed in Supabase
   */
  async markMessageFailed(message: QueuedMessage, errorMessage: string): Promise<void> {
    if (!this.enablePersistence || !this.supabase || !this.customerId || !this.sessionId) {
      return;
    }

    try {
      const { error } = await this.supabase
        .from('message_queue')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('customer_id', this.customerId)
        .eq('session_id', this.sessionId)
        .eq('message_data->key', message.key)
        .eq('message_data->timestamp', message.timestamp);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('[PersistentMessageQueue] Failed to mark message as failed:', error);
      // Don't throw - we want to continue even if update fails
    }
  }

  /**
   * Replay queued messages with persistence tracking
   */
  async replayWithPersistence(
    sendFn: (message: QueuedMessage) => Promise<void>
  ): Promise<number> {
    const messages = this.peek();
    let successCount = 0;

    for (const message of messages) {
      try {
        await sendFn(message);
        await this.markMessageProcessed(message);
        successCount++;
      } catch (error) {
        await this.markMessageFailed(
          message,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    // Clear in-memory queue
    this.clear();

    return successCount;
  }

  /**
   * Clean up old messages from Supabase (completed/failed/expired)
   */
  async cleanupOldMessages(): Promise<number> {
    if (!this.enablePersistence || !this.supabase) {
      return 0;
    }

    try {
      const { data, error } = await this.supabase.rpc('cleanup_expired_message_queue');

      if (error) {
        throw error;
      }

      return data ?? 0;
    } catch (error) {
      console.error('[PersistentMessageQueue] Failed to cleanup old messages:', error);
      return 0;
    }
  }

  /**
   * Get count of persisted messages in Supabase for current session
   */
  async getPersistedCount(): Promise<number> {
    if (!this.enablePersistence || !this.supabase || !this.customerId || !this.sessionId) {
      return 0;
    }

    try {
      const { count, error } = await this.supabase
        .from('message_queue')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', this.customerId)
        .eq('session_id', this.sessionId)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }

      return count ?? 0;
    } catch (error) {
      console.error('[PersistentMessageQueue] Failed to get persisted count:', error);
      return 0;
    }
  }
}
