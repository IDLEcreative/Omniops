import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/types';
import { parentStorage } from '@/lib/chat-widget/parent-storage';
import { enhancedParentStorage, EnhancedParentStorageAdapter } from '@/lib/chat-widget/parent-storage-enhanced';
import type { ConnectionState } from '@/lib/chat-widget/connection-monitor';

export interface PrivacySettings {
  allowOptOut: boolean;
  showPrivacyNotice: boolean;
  requireConsent: boolean;
  consentGiven: boolean;
  retentionDays: number;
}

export interface ChatWidgetConfig {
  headerTitle?: string;
  serverUrl?: string; // Omniops server URL for API calls
  domain?: string; // Customer domain for configuration lookup
  features?: {
    websiteScraping?: { enabled: boolean };
    woocommerce?: { enabled: boolean };
  };
  appearance?: {
    // Behavioral settings
    showPulseAnimation?: boolean; // Pulse ring animation on compact button (default: true)
    showNotificationBadge?: boolean; // Green dot badge on compact button (default: true)
    startMinimized?: boolean; // Start widget minimized on first load (default: true)

    // Text content
    headerTitle?: string; // Header title text
    headerSubtitle?: string; // Header subtitle text

    // Primary branding
    primaryColor?: string; // Primary color for header (hex)

    // Widget container colors
    widgetBackgroundColor?: string; // Main widget background
    widgetBorderColor?: string; // Main widget border

    // Header colors
    headerBackgroundColor?: string; // Header background
    headerBorderColor?: string; // Header border
    headerTextColor?: string; // Header text color

    // Message area colors
    messageAreaBackgroundColor?: string; // Message list background
    userMessageBackgroundColor?: string; // User message bubble background
    userMessageTextColor?: string; // User message text color
    botMessageTextColor?: string; // Bot message text color

    // Input area colors
    inputAreaBackgroundColor?: string; // Input area background
    inputAreaBorderColor?: string; // Input area border
    inputBackgroundColor?: string; // Input field background
    inputBorderColor?: string; // Input field border
    inputFocusBorderColor?: string; // Input field border on focus
    inputTextColor?: string; // Input text color
    inputPlaceholderColor?: string; // Input placeholder color

    // Button colors
    buttonGradientStart?: string; // Floating button gradient start
    buttonGradientEnd?: string; // Floating button gradient end
    buttonTextColor?: string; // Floating button icon color
    buttonHoverBackgroundColor?: string; // Button hover background

    // Typography
    fontFamily?: string; // Font family
    fontSize?: string; // Font size
    borderRadius?: string; // Border radius

    // Minimized widget icon
    minimizedIconUrl?: string; // Custom icon URL for minimized widget button
    minimizedIconHoverUrl?: string; // Custom icon URL for hover state
    minimizedIconActiveUrl?: string; // Custom icon URL for active/clicked state
  };
  behavior?: {
    // Animation settings
    animationType?: 'none' | 'pulse' | 'bounce' | 'rotate' | 'fade' | 'wiggle';
    animationSpeed?: 'slow' | 'normal' | 'fast';
    animationIntensity?: 'subtle' | 'normal' | 'strong';
  };
  branding?: {
    minimizedIconUrl?: string; // Custom icon URL for minimized widget button
    minimizedIconHoverUrl?: string; // Custom icon URL for hover state
    minimizedIconActiveUrl?: string; // Custom icon URL for active/clicked state
    customLogoUrl?: string; // Logo URL for header
  };
}

export interface UseChatStateProps {
  demoId?: string;
  demoConfig?: ChatWidgetConfig | null;
  initialOpen?: boolean;
  forceClose?: boolean;
  privacySettings?: Partial<PrivacySettings>;
  onReady?: () => void;
  onMessage?: (message: Message) => void;
  useEnhancedStorage?: boolean; // Enable enhanced storage with reliability features
}

export function useChatState({
  demoId = '',
  demoConfig = null,
  initialOpen = false,
  forceClose = false,
  privacySettings: propPrivacySettings,
  onReady,
  onMessage,
  useEnhancedStorage = false,
}: UseChatStateProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [mounted, setMounted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    allowOptOut: true,
    showPrivacyNotice: true,
    requireConsent: false,
    consentGiven: false,
    retentionDays: 30,
    ...propPrivacySettings
  });
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Connection state for enhanced storage
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  // Choose storage adapter based on feature flag
  // Use non-null assertion since we know we're in browser when this runs
  const storage = useEnhancedStorage ? (enhancedParentStorage || parentStorage) : parentStorage;

  // WooCommerce settings
  const [woocommerceEnabled, setWoocommerceEnabled] = useState(false);
  const [storeDomain, setStoreDomain] = useState<string | null>(null);

  // Message loading state
  const [loadingMessages, setLoadingMessages] = useState(false);
  const hasLoadedMessages = useRef(false);

  // Set mounted state and monitor connection if using enhanced storage
  useEffect(() => {
    setMounted(true);

    // Monitor connection state if using enhanced storage
    if (useEnhancedStorage && enhancedParentStorage) {
      import('@/lib/chat-widget/connection-monitor').then(({ connectionMonitor }) => {
        if (connectionMonitor) {
          const unsubscribe = connectionMonitor.addListener((state) => {
            setConnectionState(state);
          });

          // Set initial state
          if (enhancedParentStorage) {
            setConnectionState(enhancedParentStorage.getConnectionState());
          }

          return () => {
            unsubscribe();
          };
        }
      });
    }
  }, [useEnhancedStorage]);

  // Parse privacy settings from URL params if in embed mode
  useEffect(() => {
    if (typeof window !== 'undefined' && !demoId) {
      const params = new URLSearchParams(window.location.search);

      // Parse privacy settings from URL
      const urlPrivacySettings = {
        allowOptOut: params.get('optOut') === 'true',
        showPrivacyNotice: params.get('privacyNotice') === 'true',
        requireConsent: params.get('requireConsent') === 'true',
        consentGiven: params.get('consentGiven') === 'true',
        retentionDays: parseInt(params.get('retentionDays') || '30'),
      };

      // Merge URL settings with prop settings
      setPrivacySettings(prev => ({
        ...prev,
        ...urlPrivacySettings,
        ...propPrivacySettings
      }));

      // Check for force close parameter
      if (params.get('forceClose') === 'true' || forceClose) {
        localStorage.removeItem('chat_widget_open');
        setIsOpen(false);
      } else if (params.get('open') === 'true' || initialOpen) {
        setIsOpen(true);
      }
    }
  }, [demoId, demoConfig, propPrivacySettings, initialOpen, forceClose]);

  // Check storage for saved state after mount
  useEffect(() => {
    if (!mounted) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('open') === 'true' || params.get('forceClose') === 'true' || initialOpen || forceClose) return;

    // Use async to get from parent storage
    storage.getItem('widget_open').then(savedState => {
      if (savedState === 'true') {
        setIsOpen(true);
      }
    });
  }, [mounted, initialOpen, forceClose, storage]);

  // Save open/close state to storage
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        storage.setItem('widget_open', isOpen.toString());
      } catch (error) {
        // Storage might be disabled (private mode, CSP policy, etc.)
        console.warn('[Chat Widget] Could not save state to storage:', error);
        // Widget will still function, just won't remember state on refresh
      }
    }
  }, [isOpen, mounted, storage]);

  // Create memoized message handler to handle parent communication
  // Includes all state used in the handler to prevent stale closures
  const handleMessage = useCallback((event: MessageEvent) => {
    // Debug logging (can be enabled via ChatWidgetDebug global)
    if (typeof window !== 'undefined' && (window as any).ChatWidgetDebug) {
      console.log('[Chat Widget] Received message:', event.data.type, 'from', event.origin);
    }

    switch (event.data?.type) {
      case 'init':
        if (event.data.privacyPrefs) {
          setPrivacySettings(prev => ({
            ...prev,
            consentGiven: event.data.privacyPrefs.consentGiven,
          }));
        }
        if (event.data.woocommerceEnabled !== undefined) {
          setWoocommerceEnabled(event.data.woocommerceEnabled);
        }
        if (event.data.storeDomain) {
          setStoreDomain(event.data.storeDomain);
        }
        // Handle stored data from parent window
        if (event.data.storedData) {
          const { sessionId: storedSessionId, conversationId: storedConversationId, widgetOpen } = event.data.storedData;

          if (storedSessionId && !sessionId) {
            console.log('[Chat Widget] Received stored session ID from parent:', storedSessionId);
            setSessionId(storedSessionId);
          }

          if (storedConversationId && !conversationId) {
            console.log('[Chat Widget] Received stored conversation ID from parent:', storedConversationId);
            setConversationId(storedConversationId);
          }

          if (widgetOpen && !isOpen) {
            console.log('[Chat Widget] Widget was open, restoring state');
            setIsOpen(true);
          }
        }
        break;
      case 'open':
        if (typeof window !== 'undefined' && (window as any).ChatWidgetDebug) {
          console.log('[Chat Widget] Opening widget');
        }
        setIsOpen(true);
        break;
      case 'close':
        if (typeof window !== 'undefined' && (window as any).ChatWidgetDebug) {
          console.log('[Chat Widget] Closing widget');
        }
        setIsOpen(false);
        break;
      case 'message':
        if (event.data.message) {
          setInput(event.data.message);
        }
        break;
      case 'cleanup':
        cleanupOldMessages(event.data.retentionDays);
        break;
    }
  }, [conversationId, isOpen, sessionId]);

  // Generate session ID on mount and check WooCommerce config
  useEffect(() => {
    console.log('[useChatState] useEffect running, demoConfig:', demoConfig);
    console.log('[useChatState] demoConfig.domain:', demoConfig?.domain);

    // Reset hasLoadedMessages on mount to allow loading messages for restored conversations
    hasLoadedMessages.current = false;

    // Use async function to handle parent storage
    const initializeStorage = async () => {
      // Debug: Log what's in localStorage at mount
      const [storedSessionId, storedConversationId, storedWidgetOpen] = await Promise.all([
        storage.getItem('session_id'),
        storage.getItem('conversation_id'),
        storage.getItem('widget_open')
      ]);

      console.log('[useChatState] Mount - storage contents:', {
        session_id: storedSessionId,
        conversation_id: storedConversationId,
        widget_open: storedWidgetOpen
      });

      if (storedSessionId) {
        console.log('[useChatState] Restoring session ID:', storedSessionId);
        setSessionId(storedSessionId);
      } else {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('[useChatState] Creating new session ID:', newSessionId);
        storage.setItem('session_id', newSessionId);
        setSessionId(newSessionId);
      }

      // Restore conversation ID from storage
      if (storedConversationId) {
        console.log('[useChatState] Restoring conversation ID:', storedConversationId);
        setConversationId(storedConversationId);
      } else {
        console.log('[useChatState] No stored conversation ID found');
      }
    };

    initializeStorage();

    // Check if WooCommerce is enabled for this domain
    const checkWooCommerceConfig = async () => {
      // CRITICAL FIX: If config already has domain from parent (embed.js), use it directly
      // This prevents overwriting correct domain with empty string from API
      if (demoConfig?.domain && demoConfig.domain.trim() !== '') {
        console.log('[useChatState] Using domain from demoConfig:', demoConfig.domain);
        setStoreDomain(demoConfig.domain);
        setWoocommerceEnabled(demoConfig.features?.woocommerce?.enabled || false);
        return; // Don't fetch from API - use parent config
      }

      console.log('[useChatState] No domain in demoConfig, falling back to URL detection');

      const urlParams = new URLSearchParams(window.location.search);
      let domain = urlParams.get('domain') || window.location.hostname;

      const isDemoEnvironment =
        domain === 'localhost' ||
        domain === '127.0.0.1';

      if (isDemoEnvironment) {
        const DEMO_DOMAIN = process.env.NEXT_PUBLIC_DEMO_DOMAIN || 'demo.example.com';
        domain = DEMO_DOMAIN;
      }

      try {
        // Use public widget config endpoint (no authentication required)
        const response = await fetch(`/api/widget/config?domain=${encodeURIComponent(domain)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setWoocommerceEnabled(data.config.woocommerce_enabled || false);
            // Only set storeDomain if API returns non-empty domain
            const apiDomain = data.config.domain && data.config.domain.trim() !== ''
              ? data.config.domain
              : domain;
            setStoreDomain(apiDomain);
          }
        }
      } catch (error) {
        console.log('Could not load widget config:', error);
      }
    };

    checkWooCommerceConfig();

    window.addEventListener('message', handleMessage);

    if (window.parent !== window) {
      const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      window.parent.postMessage({ type: 'ready' }, targetOrigin);
    }

    if (onReady) {
      onReady();
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onReady, demoConfig, handleMessage, storage]);

  // Fetch previous messages from API
  const loadPreviousMessages = useCallback(async (convId: string, sessId: string) => {
    if (!convId || !sessId || hasLoadedMessages.current) {
      return;
    }

    setLoadingMessages(true);
    hasLoadedMessages.current = true;

    try {
      // Build API URL - use serverUrl from config if available
      const apiUrl = demoConfig?.serverUrl
        ? `${demoConfig.serverUrl}/api/conversations/${convId}/messages?session_id=${sessId}`
        : `/api/conversations/${convId}/messages?session_id=${sessId}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.messages && data.messages.length > 0) {
          console.log('[useChatState] Loaded previous messages:', data.messages.length);
          setMessages(data.messages);
        } else {
          // Conversation not found or expired - clear stored ID
          console.log('[useChatState] No messages found, clearing conversation ID');
          storage.removeItem('conversation_id');
          setConversationId('');
          hasLoadedMessages.current = false; // Reset to allow new conversation
        }
      } else {
        // API error - clear stored ID to start fresh
        console.warn('[useChatState] Failed to load messages, clearing conversation ID');
        storage.removeItem('conversation_id');
        setConversationId('');
        hasLoadedMessages.current = false; // Reset to allow new conversation
      }
    } catch (error) {
      console.error('[useChatState] Error loading messages:', error);
      // On error, clear stored conversation to allow fresh start
      storage.removeItem('conversation_id');
      setConversationId('');
      hasLoadedMessages.current = false; // Reset to allow new conversation
    } finally {
      setLoadingMessages(false);
    }
  }, [demoConfig, storage]);

  // Clean up old messages
  const cleanupOldMessages = (retentionDays: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const stored = localStorage.getItem('chat_messages');
    if (stored) {
      const messages = JSON.parse(stored);
      const filtered = messages.filter((msg: Message) =>
        new Date(msg.created_at) > cutoffDate
      );
      localStorage.setItem('chat_messages', JSON.stringify(filtered));
    }
  };

  // Persist conversation ID to storage when it changes
  useEffect(() => {
    if (mounted && conversationId) {
      try {
        storage.setItem('conversation_id', conversationId);
        console.log('[useChatState] Persisted conversation ID:', conversationId);
      } catch (error) {
        console.warn('[useChatState] Could not save conversation ID to storage:', error);
      }
    } else if (mounted && !conversationId) {
      // Conversation was cleared, reset the flag to allow loading new messages
      hasLoadedMessages.current = false;
    }
  }, [conversationId, mounted, storage]);

  // Load previous messages when widget opens with existing conversation
  useEffect(() => {
    if (isOpen && mounted && conversationId && sessionId && !hasLoadedMessages.current) {
      console.log('[useChatState] Widget opened with existing conversation, loading messages');
      loadPreviousMessages(conversationId, sessionId);
    }
  }, [isOpen, mounted, conversationId, sessionId, loadPreviousMessages]);

  // Notify parent window when widget opens/closes and request resize
  useEffect(() => {
    if (mounted && window.parent !== window) {
      const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      if (isOpen) {
        // Widget is open - request full size and enable pointer events
        window.parent.postMessage({ type: 'widgetOpened' }, targetOrigin);
        window.parent.postMessage({
          type: 'resize',
          width: 400,  // Full width for open widget
          height: 580, // Full height for open widget
        }, targetOrigin);
      } else {
        // Widget is closed - request minimal size for button only
        window.parent.postMessage({ type: 'widgetClosed' }, targetOrigin);
        window.parent.postMessage({
          type: 'resize',
          width: 64,  // Just enough for the button (14 * 4 + padding)
          height: 64, // Just enough for the button
        }, targetOrigin);
      }
    }
  }, [isOpen, mounted]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleConsent = () => {
    setPrivacySettings(prev => ({ ...prev, consentGiven: true }));
    const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    window.parent.postMessage({
      type: 'privacy',
      action: 'giveConsent',
    }, targetOrigin);
  };

  return {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    loadingMessages,
    conversationId,
    setConversationId,
    sessionId,
    isOpen,
    setIsOpen,
    mounted,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    textareaRef,
    privacySettings,
    messagesContainerRef,
    woocommerceEnabled,
    storeDomain,
    handleConsent,
    onMessage,
    connectionState, // Connection state for reliability monitoring
  };
}
