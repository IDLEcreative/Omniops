/**
 * Memory Manager
 *
 * Implements LRU cache for messages to prevent memory bloat in long conversations.
 * Automatically evicts least recently used messages when threshold is reached.
 *
 * Performance Target: <50MB memory usage for 500 messages
 */

import { Message } from '@/types/database';
import { PerformanceConfig, DEFAULT_PERFORMANCE_CONFIG } from './config';

export class MemoryManager {
  private config: PerformanceConfig['memoryManagement'];
  private messageCache: Map<string, Message> = new Map();
  private accessOrder: string[] = [];

  constructor(config?: Partial<PerformanceConfig['memoryManagement']>) {
    this.config = {
      ...DEFAULT_PERFORMANCE_CONFIG.memoryManagement,
      ...config,
    };
  }

  /**
   * Add message to cache
   */
  public addMessage(message: Message): void {
    const { id } = message;

    // Update access order
    this.accessOrder = this.accessOrder.filter(msgId => msgId !== id);
    this.accessOrder.push(id);

    // Add to cache
    this.messageCache.set(id, message);

    // Cleanup if over threshold
    if (this.messageCache.size >= this.config.cleanupThreshold) {
      this.cleanup();
    }
  }

  /**
   * Get message from cache
   */
  public getMessage(id: string): Message | undefined {
    const message = this.messageCache.get(id);

    if (message) {
      // Update access order (LRU)
      this.accessOrder = this.accessOrder.filter(msgId => msgId !== id);
      this.accessOrder.push(id);
    }

    return message;
  }

  /**
   * Cleanup old messages (LRU eviction)
   */
  private cleanup(): void {
    const { maxMessagesInMemory } = this.config;
    const toRemove = this.messageCache.size - maxMessagesInMemory;

    if (toRemove <= 0) return;

    // Remove least recently used messages
    const idsToRemove = this.accessOrder.slice(0, toRemove);
    idsToRemove.forEach(id => {
      this.messageCache.delete(id);
    });

    this.accessOrder = this.accessOrder.slice(toRemove);
  }

  /**
   * Get current memory usage estimate
   */
  public getMemoryEstimate(): {
    messageCacheSizeMB: number;
    messageCount: number;
    avgMessageSizeKB: number;
  } {
    const messageCount = this.messageCache.size;

    // Estimate: ~1KB per message on average
    const totalSizeKB = messageCount * 1;
    const totalSizeMB = totalSizeKB / 1024;

    return {
      messageCacheSizeMB: totalSizeMB,
      messageCount,
      avgMessageSizeKB: messageCount > 0 ? totalSizeKB / messageCount : 0,
    };
  }

  /**
   * Clear all cached messages
   */
  public clear(): void {
    this.messageCache.clear();
    this.accessOrder = [];
  }
}
