/**
 * Message Pagination Manager
 *
 * Implements lazy loading of messages to reduce initial render time.
 * Loads messages in pages as user scrolls to older messages.
 *
 * Performance Target: <16ms initial render time
 */

import { Message } from '@/types/database';
import { PerformanceConfig, DEFAULT_PERFORMANCE_CONFIG } from './config';

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  loadedMessages: number;
  hasMore: boolean;
}

export class MessagePaginator {
  private config: PerformanceConfig['pagination'];
  private allMessages: Message[] = [];
  private loadedPages: Set<number> = new Set();

  constructor(config?: Partial<PerformanceConfig['pagination']>) {
    this.config = {
      ...DEFAULT_PERFORMANCE_CONFIG.pagination,
      ...config,
    };
  }

  /**
   * Initialize with all messages
   */
  public setMessages(messages: Message[]): void {
    this.allMessages = messages;
    this.loadedPages.clear();
    this.loadedPages.add(0); // First page always loaded
  }

  /**
   * Get initial messages to display
   */
  public getInitialMessages(): Message[] {
    if (!this.config.enabled || this.allMessages.length < this.config.threshold) {
      return this.allMessages;
    }

    return this.allMessages.slice(-this.config.initialLoad);
  }

  /**
   * Load more messages (older messages)
   */
  public loadMore(currentCount: number): Message[] {
    const { pageSize } = this.config;
    const totalMessages = this.allMessages.length;

    if (currentCount >= totalMessages) {
      return [];
    }

    const startIndex = Math.max(0, totalMessages - currentCount - pageSize);
    const endIndex = totalMessages - currentCount;

    const page = Math.floor(currentCount / pageSize);
    this.loadedPages.add(page);

    return this.allMessages.slice(startIndex, endIndex);
  }

  /**
   * Get pagination state
   */
  public getState(currentMessageCount: number): PaginationState {
    const totalMessages = this.allMessages.length;
    const { pageSize } = this.config;

    return {
      currentPage: Math.floor(currentMessageCount / pageSize),
      totalPages: Math.ceil(totalMessages / pageSize),
      loadedMessages: currentMessageCount,
      hasMore: currentMessageCount < totalMessages,
    };
  }

  /**
   * Check if pagination should be enabled
   */
  public shouldEnable(messageCount: number): boolean {
    return this.config.enabled && messageCount >= this.config.threshold;
  }
}
