/**
 * Message Queue
 *
 * Manages queued messages during disconnection and replays them when reconnected.
 */

import type { QueuedMessage } from './types';

export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private readonly maxQueueSize: number;
  private debug: boolean;

  constructor(maxQueueSize: number = 100, debug: boolean = false) {
    this.maxQueueSize = maxQueueSize;
    this.debug = debug;
  }

  /**
   * Add message to queue
   */
  enqueue(message: QueuedMessage): void {
    this.queue.push(message);

    if (this.debug) {
    }

    // Prevent queue from growing too large (keep last N messages)
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift();
    }
  }

  /**
   * Replay all queued messages
   */
  replay(sendFn: (message: QueuedMessage) => void): number {
    const count = this.queue.length;

    if (count === 0) return 0;

    if (this.debug) {
    }

    // Replay all messages
    this.queue.forEach((message) => {
      sendFn(message);
    });

    // Clear queue
    this.queue = [];

    return count;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear all queued messages
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Peek at queued messages without removing them
   */
  peek(): QueuedMessage[] {
    return [...this.queue];
  }
}
