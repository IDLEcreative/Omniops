/**
 * Parent Storage Adapter
 *
 * Provides localStorage functionality that works across iframe boundaries
 * by storing data in the parent window's localStorage instead of iframe's.
 * This ensures conversation data persists when navigating between pages.
 */

export class ParentStorageAdapter {
  private isInIframe: boolean;
  private requestCounter = 0;
  private pendingRequests = new Map<string, (value: string | null) => void>();

  constructor() {
    this.isInIframe = window.self !== window.top;

    // Listen for storage responses from parent
    if (this.isInIframe) {
      window.addEventListener('message', (event) => {
        if (event.data?.type === 'storageResponse' && event.data?.requestId) {
          const resolver = this.pendingRequests.get(event.data.requestId);
          if (resolver) {
            resolver(event.data.value);
            this.pendingRequests.delete(event.data.requestId);
          }
        }
      });
    }
  }

  /**
   * Get item from storage (parent localStorage if in iframe, regular localStorage otherwise)
   */
  async getItem(key: string): Promise<string | null> {
    if (!this.isInIframe) {
      // Not in iframe, use regular localStorage
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('[ParentStorageAdapter] localStorage.getItem failed:', error);
        return null;
      }
    }

    // In iframe, request from parent
    return new Promise((resolve) => {
      const requestId = `request_${++this.requestCounter}_${Date.now()}`;
      this.pendingRequests.set(requestId, resolve);

      const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      window.parent.postMessage({
        type: 'getFromParentStorage',
        key,
        requestId
      }, targetOrigin);

      // Timeout after 500ms
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          resolve(null);
        }
      }, 500);
    });
  }

  /**
   * Set item in storage (parent localStorage if in iframe, regular localStorage otherwise)
   */
  async setItem(key: string, value: string): Promise<void> {
    if (!this.isInIframe) {
      // Not in iframe, use regular localStorage
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('[ParentStorageAdapter] localStorage.setItem failed:', error);
      }
      return;
    }

    // In iframe, send to parent
    const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    window.parent.postMessage({
      type: 'saveToParentStorage',
      key,
      value
    }, targetOrigin);
  }

  /**
   * Remove item from storage (parent localStorage if in iframe, regular localStorage otherwise)
   */
  async removeItem(key: string): Promise<void> {
    if (!this.isInIframe) {
      // Not in iframe, use regular localStorage
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('[ParentStorageAdapter] localStorage.removeItem failed:', error);
      }
      return;
    }

    // In iframe, send to parent
    const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    window.parent.postMessage({
      type: 'removeFromParentStorage',
      key
    }, targetOrigin);
  }

  /**
   * Get item synchronously (fallback to regular localStorage if in iframe)
   * Used for immediate needs where async isn't possible
   */
  getItemSync(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[ParentStorageAdapter] Sync getItem failed:', error);
      return null;
    }
  }
}

// Create singleton instance (only in browser)
export const parentStorage = typeof window !== 'undefined'
  ? new ParentStorageAdapter()
  : ({ getItem: async () => null, setItem: () => {}, removeItem: () => {}, getItemSync: () => null } as any as ParentStorageAdapter);