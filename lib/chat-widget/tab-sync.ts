/**
 * Tab Synchronization Manager
 *
 * Synchronizes conversation state across multiple browser tabs using
 * BroadcastChannel API with localStorage fallback for older browsers.
 *
 * Features:
 * - Real-time message synchronization
 * - Typing indicator coordination
 * - Tab focus management
 * - Conversation state sync
 * - Graceful fallback for unsupported browsers
 */

import {
  TabSyncMessage,
  TabSyncMessageType,
  TabSyncPayload,
  TabState,
} from '@/types/analytics';

type TabSyncListener = (message: TabSyncMessage) => void;

export class TabSyncManager {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private listeners: Set<TabSyncListener> = new Set();
  private storageListener: ((event: StorageEvent) => void) | null = null;
  private hasBroadcastSupport: boolean;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();

  constructor(channelName: string = 'omniops-chat-sync') {
    this.tabId = this.generateTabId();
    this.hasBroadcastSupport = typeof BroadcastChannel !== 'undefined';

    if (this.hasBroadcastSupport) {
      this.initBroadcastChannel(channelName);
    } else {
      this.initLocalStorageFallback();
    }

    this.startHeartbeat();
    this.setupVisibilityListener();
    this.setupBeforeUnload();
  }

  /**
   * Initialize BroadcastChannel for modern browsers
   */
  private initBroadcastChannel(channelName: string): void {
    try {
      this.channel = new BroadcastChannel(channelName);
      this.channel.onmessage = (event: MessageEvent) => {
        const message = event.data as TabSyncMessage;
        // Don't process our own messages
        if (message.sender_tab_id !== this.tabId) {
          this.notifyListeners(message);
        }
      };
    } catch (error) {
      console.warn('[TabSync] BroadcastChannel failed, falling back to localStorage:', error);
      this.hasBroadcastSupport = false;
      this.initLocalStorageFallback();
    }
  }

  /**
   * Initialize localStorage-based synchronization for older browsers
   */
  private initLocalStorageFallback(): void {
    const STORAGE_KEY = 'omniops-tab-sync-messages';

    this.storageListener = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const message = JSON.parse(event.newValue) as TabSyncMessage;
          if (message.sender_tab_id !== this.tabId) {
            this.notifyListeners(message);
          }
        } catch (error) {
          console.error('[TabSync] Failed to parse storage message:', error);
        }
      }
    };

    window.addEventListener('storage', this.storageListener);
  }

  /**
   * Send message to all other tabs
   */
  public send(type: TabSyncMessageType, payload: TabSyncPayload): void {
    const message: TabSyncMessage = {
      type,
      payload,
      sender_tab_id: this.tabId,
      timestamp: new Date().toISOString(),
    };

    if (this.hasBroadcastSupport && this.channel) {
      this.channel.postMessage(message);
    } else {
      // Use localStorage for synchronization
      const STORAGE_KEY = 'omniops-tab-sync-messages';
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
        // Clean up immediately to avoid storage clutter
        setTimeout(() => {
          const current = localStorage.getItem(STORAGE_KEY);
          if (current === JSON.stringify(message)) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }, 100);
      } catch (error) {
        console.error('[TabSync] Failed to send via localStorage:', error);
      }
    }

    this.lastActivity = Date.now();
  }

  /**
   * Subscribe to sync messages
   */
  public subscribe(listener: TabSyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of a new message
   */
  private notifyListeners(message: TabSyncMessage): void {
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('[TabSync] Listener error:', error);
      }
    });
  }

  /**
   * Get current tab state
   */
  public getTabState(): TabState {
    return {
      tab_id: this.tabId,
      is_active: !document.hidden,
      has_focus: document.hasFocus(),
      conversation_open: this.getConversationOpenState(),
      last_activity: new Date(this.lastActivity).toISOString(),
    };
  }

  /**
   * Check if conversation is currently open (from localStorage)
   */
  private getConversationOpenState(): boolean {
    try {
      const state = localStorage.getItem('omniops-widget-state');
      if (state) {
        const parsed = JSON.parse(state);
        return parsed.isOpen === true;
      }
    } catch (error) {
      console.error('[TabSync] Failed to read conversation state:', error);
    }
    return false;
  }

  /**
   * Start heartbeat to track active tabs
   */
  private startHeartbeat(): void {
    const HEARTBEAT_INTERVAL = 30000; // 30 seconds

    this.heartbeatInterval = setInterval(() => {
      this.send('TAB_FOCUS_CHANGE', {
        has_focus: document.hasFocus(),
        tab_id: this.tabId,
      });
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Setup visibility change listener
   */
  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      this.send('TAB_FOCUS_CHANGE', {
        has_focus: !document.hidden,
        tab_id: this.tabId,
      });
    });
  }

  /**
   * Setup beforeunload to notify other tabs
   */
  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      this.send('TAB_CLOSE', {
        has_focus: false,
        tab_id: this.tabId,
      });
    });
  }

  /**
   * Generate unique tab ID
   */
  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get tab ID
   */
  public getTabId(): string {
    return this.tabId;
  }

  /**
   * Check if BroadcastChannel is supported
   */
  public hasBroadcastChannelSupport(): boolean {
    return this.hasBroadcastSupport;
  }

  /**
   * Cleanup and close connections
   */
  public destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }

    this.listeners.clear();
  }
}

/**
 * Singleton instance for global tab synchronization
 */
let globalTabSyncInstance: TabSyncManager | null = null;

export function getTabSyncManager(): TabSyncManager {
  if (!globalTabSyncInstance) {
    globalTabSyncInstance = new TabSyncManager();
  }
  return globalTabSyncInstance;
}

export function destroyTabSyncManager(): void {
  if (globalTabSyncInstance) {
    globalTabSyncInstance.destroy();
    globalTabSyncInstance = null;
  }
}
