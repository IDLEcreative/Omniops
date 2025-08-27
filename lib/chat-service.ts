import { createServiceRoleClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ChatSession {
  id?: string;
  session_id?: string;
  user_id?: string;
  started_at?: string;
  ended_at?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface ChatMessage {
  id?: string;
  message_id?: string;
  session_id?: string;
  conversation_id?: string;
  user_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export class ChatService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    this.supabase = await createServiceRoleClient();
  }

  async createSession(userId?: string, metadata?: Record<string, unknown>): Promise<ChatSession> {
    if (!this.supabase) await this.initializeClient();
    
    const sessionData = {
      user_id: userId || null,
      started_at: new Date().toISOString(),
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase!
      .from('conversations')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    return data;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    if (!this.supabase) await this.initializeClient();

    // Try both id and session_id fields
    const { data, error } = await this.supabase!
      .from('conversations')
      .select('*')
      .or(`id.eq.${sessionId},session_id.eq.${sessionId}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching session:', error);
      throw error;
    }

    return data;
  }

  async addMessage(
    sessionId: string, 
    role: 'user' | 'assistant' | 'system', 
    content: string, 
    metadata?: Record<string, unknown>
  ): Promise<ChatMessage> {
    if (!this.supabase) await this.initializeClient();

    const messageData = {
      conversation_id: sessionId,
      session_id: sessionId,
      role,
      content,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase!
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      throw error;
    }

    // Update session timestamp
    await this.updateSessionMetadata(sessionId, {
      updated_at: new Date().toISOString()
    });

    return data;
  }

  async getConversationHistory(sessionId: string, limit: number = 10): Promise<ChatMessage[]> {
    if (!this.supabase) await this.initializeClient();

    // Try both conversation_id and session_id fields
    const { data, error } = await this.supabase!
      .from('messages')
      .select('*')
      .or(`conversation_id.eq.${sessionId},session_id.eq.${sessionId}`)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }

    return data || [];
  }

  async updateSessionMetadata(sessionId: string, updates: Partial<ChatSession>): Promise<void> {
    if (!this.supabase) await this.initializeClient();

    const { error } = await this.supabase!
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .or(`id.eq.${sessionId},session_id.eq.${sessionId}`);

    if (error) {
      console.error('Error updating session metadata:', error);
      throw error;
    }
  }

  calculateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  async storeWordPressContext(sessionId: string, context: {
    userData?: unknown;
    pageContext?: unknown;
    cartData?: unknown;
    orderContext?: unknown;
  }): Promise<void> {
    const metadata = {
      wordpress_context: {
        user_data: context.userData,
        page_context: context.pageContext,
        cart_data: context.cartData,
        order_context: context.orderContext,
        timestamp: new Date().toISOString()
      }
    };

    await this.updateSessionMetadata(sessionId, {
      metadata
    });
  }

  async getOrCreateSession(sessionId: string, userId?: string, metadata?: Record<string, unknown>): Promise<ChatSession> {
    let session = await this.getSession(sessionId);
    
    if (!session) {
      session = await this.createSession(userId, metadata);
    }
    
    return session;
  }

  async generateSessionTitle(sessionId: string, firstMessage: string): Promise<void> {
    const title = firstMessage.slice(0, 100) + (firstMessage.length > 100 ? '...' : '');
    await this.updateSessionMetadata(sessionId, { title });
  }

  async endSession(sessionId: string): Promise<void> {
    await this.updateSessionMetadata(sessionId, {
      ended_at: new Date().toISOString()
    });
  }

  async cleanupOldSessions(daysOld: number = 30): Promise<void> {
    if (!this.supabase) await this.initializeClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await this.supabase!
      .from('conversations')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .is('ended_at', null);

    if (error) {
      console.error('Error cleaning up old sessions:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();