/**
 * Cart Session Manager
 *
 * Handles session tokens/nonces for WooCommerce Store API cart persistence.
 * Sessions are stored in Redis with automatic expiration.
 *
 * Session Types:
 * - Guest sessions: Generated UUID, no authentication required
 * - Authenticated sessions: User ID-based, linked to WooCommerce customer
 *
 * Storage Strategy:
 * - Key format: `cart:session:{domain}:{userId}`
 * - TTL: 24 hours (matches typical WooCommerce cart expiration)
 * - Automatic cleanup via Redis expiration
 *
 * Security:
 * - Nonces are randomly generated and stored securely
 * - Guest IDs use crypto.randomUUID() for uniqueness
 * - Cross-domain isolation via domain prefix
 */

import { getRedisClient } from './redis';
import type { RedisClientWithFallback } from './redis-fallback';
import type Redis from 'ioredis';
import { randomUUID } from 'crypto';

// ==================== TYPES ====================

export interface CartSession {
  userId: string;
  domain: string;
  nonce: string;
  createdAt: string;
  expiresAt: string;
  isGuest: boolean;
}

export interface SessionOptions {
  ttl?: number; // TTL in seconds, default 24 hours
}

// ==================== SESSION MANAGER ====================

export class CartSessionManager {
  private redis: Redis | RedisClientWithFallback;
  private readonly DEFAULT_TTL = 86400; // 24 hours in seconds
  private readonly KEY_PREFIX = 'cart:session';

  constructor(redis?: Redis | RedisClientWithFallback) {
    this.redis = redis || getRedisClient();
  }

  /**
   * Build Redis key for session
   */
  private buildKey(domain: string, userId: string): string {
    return `${this.KEY_PREFIX}:${domain}:${userId}`;
  }

  /**
   * Generate a random nonce for session authentication
   */
  private generateNonce(): string {
    return randomUUID().replace(/-/g, '');
  }

  /**
   * Generate unique guest session ID
   */
  generateGuestId(): string {
    return `guest_${randomUUID()}`;
  }

  /**
   * Get or create session for user
   */
  async getSession(
    userId: string,
    domain: string,
    options: SessionOptions = {}
  ): Promise<CartSession> {
    const key = this.buildKey(domain, userId);
    const ttl = options.ttl || this.DEFAULT_TTL;

    // Try to retrieve existing session
    const existingData = await this.redis.get(key);

    if (existingData) {
      try {
        const session: CartSession = JSON.parse(existingData);
        // Refresh TTL on access
        await this.redis.expire(key, ttl);
        return session;
      } catch (error) {
        // Invalid JSON, create new session
        console.error('[CartSessionManager] Failed to parse session:', error);
      }
    }

    // Create new session
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const session: CartSession = {
      userId,
      domain,
      nonce: this.generateNonce(),
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isGuest: userId.startsWith('guest_'),
    };

    await this.storeSession(userId, domain, session, ttl);

    return session;
  }

  /**
   * Store session in Redis
   */
  async storeSession(
    userId: string,
    domain: string,
    session: CartSession,
    ttl?: number
  ): Promise<void> {
    const key = this.buildKey(domain, userId);
    const sessionTtl = ttl || this.DEFAULT_TTL;

    await this.redis.setex(
      key,
      sessionTtl,
      JSON.stringify(session)
    );
  }

  /**
   * Update existing session (e.g., refresh nonce)
   */
  async updateSession(
    userId: string,
    domain: string,
    updates: Partial<CartSession>,
    ttl?: number
  ): Promise<CartSession | null> {
    const key = this.buildKey(domain, userId);
    const existingData = await this.redis.get(key);

    if (!existingData) {
      return null;
    }

    try {
      const session: CartSession = JSON.parse(existingData);
      const updatedSession: CartSession = {
        ...session,
        ...updates,
      };

      const sessionTtl = ttl || this.DEFAULT_TTL;
      await this.redis.setex(
        key,
        sessionTtl,
        JSON.stringify(updatedSession)
      );

      return updatedSession;
    } catch (error) {
      console.error('[CartSessionManager] Failed to update session:', error);
      return null;
    }
  }

  /**
   * Clear session (logout, cart reset)
   */
  async clearSession(userId: string, domain: string): Promise<void> {
    const key = this.buildKey(domain, userId);
    await this.redis.del(key);
  }

  /**
   * Get session TTL (time to live in seconds)
   */
  async getSessionTTL(userId: string, domain: string): Promise<number> {
    const key = this.buildKey(domain, userId);
    const ttl = await (this.redis as any).ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Check if session exists
   */
  async hasSession(userId: string, domain: string): Promise<boolean> {
    const key = this.buildKey(domain, userId);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Extend session expiration
   */
  async extendSession(
    userId: string,
    domain: string,
    additionalSeconds: number = 86400
  ): Promise<boolean> {
    const key = this.buildKey(domain, userId);
    const currentTtl = await (this.redis as any).ttl(key);

    if (currentTtl > 0) {
      const newTtl = currentTtl + additionalSeconds;
      await this.redis.expire(key, newTtl);
      return true;
    }

    return false;
  }

  /**
   * List all active sessions for a domain (admin use)
   */
  async listDomainSessions(domain: string): Promise<CartSession[]> {
    const pattern = `${this.KEY_PREFIX}:${domain}:*`;
    const keys = await this.redis.keys(pattern);

    const sessions: CartSession[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        try {
          sessions.push(JSON.parse(data));
        } catch (error) {
          // Skip invalid sessions
          console.error('[CartSessionManager] Invalid session data:', error);
        }
      }
    }

    return sessions;
  }

  /**
   * Clean up expired sessions (manual cleanup, Redis auto-expires)
   */
  async cleanupExpiredSessions(domain: string): Promise<number> {
    const sessions = await this.listDomainSessions(domain);
    const now = new Date();
    let cleaned = 0;

    for (const session of sessions) {
      const expiresAt = new Date(session.expiresAt);
      if (expiresAt < now) {
        await this.clearSession(session.userId, session.domain);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// ==================== SINGLETON ====================

let sessionManager: CartSessionManager | null = null;

export function getCartSessionManager(): CartSessionManager {
  if (!sessionManager) {
    sessionManager = new CartSessionManager();
  }
  return sessionManager;
}
