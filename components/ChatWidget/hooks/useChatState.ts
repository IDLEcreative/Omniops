import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import { parentStorage } from '@/lib/chat-widget/parent-storage';
import { enhancedParentStorage } from '@/lib/chat-widget/parent-storage-enhanced';
import type { ConnectionState } from '@/lib/chat-widget/connection-monitor';
import { useSessionManagement } from './useSessionManagement';
import { useMessageState } from './useMessageState';
import { useParentCommunication } from './useParentCommunication';
import { useWidgetConfig } from './useWidgetConfig';
import { usePrivacySettings, type PrivacySettings } from './usePrivacySettings';

// Re-export PrivacySettings for backward compatibility
export type { PrivacySettings };

export interface ChatWidgetConfig {
  headerTitle?: string;
  serverUrl?: string;
  domain?: string;
  features?: {
    websiteScraping?: { enabled: boolean };
    woocommerce?: { enabled: boolean };
  };
  appearance?: {
    showPulseAnimation?: boolean;
    showNotificationBadge?: boolean;
    startMinimized?: boolean;
    headerTitle?: string;
    headerSubtitle?: string;
    primaryColor?: string;
    widgetBackgroundColor?: string;
    widgetBorderColor?: string;
    headerBackgroundColor?: string;
    headerBorderColor?: string;
    headerTextColor?: string;
    messageAreaBackgroundColor?: string;
    userMessageBackgroundColor?: string;
    userMessageTextColor?: string;
    botMessageTextColor?: string;
    inputAreaBackgroundColor?: string;
    inputAreaBorderColor?: string;
    inputBackgroundColor?: string;
    inputBorderColor?: string;
    inputFocusBorderColor?: string;
    inputTextColor?: string;
    inputPlaceholderColor?: string;
    buttonGradientStart?: string;
    buttonGradientEnd?: string;
    buttonTextColor?: string;
    buttonHoverBackgroundColor?: string;
    fontFamily?: string;
    fontSize?: string;
    borderRadius?: string;
    minimizedIconUrl?: string;
    minimizedIconHoverUrl?: string;
    minimizedIconActiveUrl?: string;
  };
  behavior?: {
    animationType?: 'none' | 'pulse' | 'bounce' | 'rotate' | 'fade' | 'wiggle';
    animationSpeed?: 'slow' | 'normal' | 'fast';
    animationIntensity?: 'subtle' | 'normal' | 'strong';
  };
  branding?: {
    minimizedIconUrl?: string;
    minimizedIconHoverUrl?: string;
    minimizedIconActiveUrl?: string;
    customLogoUrl?: string;
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
  useEnhancedStorage?: boolean;
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
  // UI state (not extracted to hooks)
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [mounted, setMounted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  // Choose storage adapter based on feature flag
  const storage = useEnhancedStorage ? (enhancedParentStorage || parentStorage) : parentStorage;

  // Compose all the extracted hooks
  const session = useSessionManagement({ storage, mounted });
  const messageState = useMessageState({
    conversationId: session.conversationId,
    sessionId: session.sessionId,
    demoConfig,
    storage,
  });
  const config = useWidgetConfig({ demoConfig });
  const privacy = usePrivacySettings({
    propPrivacySettings,
    demoId,
    initialOpen,
    forceClose,
  });

  // Clean up old messages helper function
  const cleanupOldMessages = (retentionDays: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const stored = localStorage.getItem('chat_messages');
    if (stored) {
      const msgs = JSON.parse(stored);
      const filtered = msgs.filter((msg: Message) => new Date(msg.created_at) > cutoffDate);
      localStorage.setItem('chat_messages', JSON.stringify(filtered));
    }
  };

  // Parent window communication hook
  useParentCommunication({
    conversationId: session.conversationId,
    isOpen,
    sessionId: session.sessionId,
    mounted,
    setPrivacySettings: privacy.setPrivacySettings,
    setWoocommerceEnabled: config.setWoocommerceEnabled,
    setStoreDomain: config.setStoreDomain,
    setSessionId: () => {}, // Read-only from session hook
    setConversationId: session.setConversationId,
    setIsOpen,
    setInput: messageState.setInput,
    cleanupOldMessages,
    onReady,
  });

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

  // Handle forceClose and initialOpen from URL params
  useEffect(() => {
    if (typeof window !== 'undefined' && !demoId) {
      const params = new URLSearchParams(window.location.search);

      if (params.get('forceClose') === 'true' || forceClose) {
        localStorage.removeItem('chat_widget_open');
        setIsOpen(false);
      } else if (params.get('open') === 'true' || initialOpen) {
        setIsOpen(true);
      }
    }
  }, [demoId, initialOpen, forceClose]);

  // Check storage for saved widget state after mount
  useEffect(() => {
    if (!mounted) return;

    const params = new URLSearchParams(window.location.search);
    if (
      params.get('open') === 'true' ||
      params.get('forceClose') === 'true' ||
      initialOpen ||
      forceClose
    )
      return;

    storage.getItem('widget_open').then((savedState) => {
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
        console.warn('[Chat Widget] Could not save state to storage:', error);
      }
    }
  }, [isOpen, mounted, storage]);

  // Load previous messages when widget opens with existing conversation
  useEffect(() => {
    if (isOpen && mounted && session.conversationId && session.sessionId) {
      messageState.loadPreviousMessages(session.conversationId, session.sessionId);
    }
  }, [isOpen, mounted, session.conversationId, session.sessionId, messageState]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageState.messagesContainerRef.current) {
      messageState.messagesContainerRef.current.scrollTop =
        messageState.messagesContainerRef.current.scrollHeight;
    }
  }, [messageState.messages, messageState.messagesContainerRef]);

  return {
    // From messageState hook
    messages: messageState.messages,
    setMessages: messageState.setMessages,
    input: messageState.input,
    setInput: messageState.setInput,
    loading: messageState.loading,
    setLoading: messageState.setLoading,
    loadingMessages: messageState.loadingMessages,
    messagesContainerRef: messageState.messagesContainerRef,
    // From session hook
    conversationId: session.conversationId,
    setConversationId: session.setConversationId,
    sessionId: session.sessionId,
    sessionLoading: session.isLoading,
    sessionError: session.error,
    // From config hook
    woocommerceEnabled: config.woocommerceEnabled,
    storeDomain: config.storeDomain,
    // From privacy hook
    privacySettings: privacy.privacySettings,
    handleConsent: privacy.handleConsent,
    // Local state
    isOpen,
    setIsOpen,
    mounted,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    textareaRef,
    connectionState,
    onMessage,
  };
}
