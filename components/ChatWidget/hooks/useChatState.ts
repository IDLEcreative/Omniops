import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';

export interface PrivacySettings {
  allowOptOut: boolean;
  showPrivacyNotice: boolean;
  requireConsent: boolean;
  consentGiven: boolean;
  retentionDays: number;
}

export interface ChatWidgetConfig {
  headerTitle?: string;
  features?: {
    websiteScraping?: { enabled: boolean };
    woocommerce?: { enabled: boolean };
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
}

export function useChatState({
  demoId = '',
  demoConfig = null,
  initialOpen = false,
  forceClose = false,
  privacySettings: propPrivacySettings,
  onReady,
  onMessage,
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

  // WooCommerce settings
  const [woocommerceEnabled, setWoocommerceEnabled] = useState(false);
  const [storeDomain, setStoreDomain] = useState<string | null>(null);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Check localStorage for saved state after mount
  useEffect(() => {
    if (!mounted) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('open') === 'true' || params.get('forceClose') === 'true' || initialOpen || forceClose) return;

    const savedState = localStorage.getItem('chat_widget_open');
    if (savedState === 'true') {
      setIsOpen(true);
    }
  }, [mounted, initialOpen, forceClose]);

  // Save open/close state to localStorage
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('chat_widget_open', isOpen.toString());
    }
  }, [isOpen, mounted]);

  // Generate session ID on mount and check WooCommerce config
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chat_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_session_id', newSessionId);
      setSessionId(newSessionId);
    }

    // Check if WooCommerce is enabled for this domain
    const checkWooCommerceConfig = async () => {
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
        const response = await fetch(`/api/customer/config?domain=${encodeURIComponent(domain)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.config?.woocommerce_enabled) {
            setWoocommerceEnabled(true);
            setStoreDomain(data.config.domain || domain);
          }
        }
      } catch (error) {
        console.log('Could not load WooCommerce config:', error);
      }
    };

    checkWooCommerceConfig();

    // Listen for messages from parent window (for embed mode)
    const handleMessage = (event: MessageEvent) => {
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
          break;
        case 'open':
          setIsOpen(true);
          break;
        case 'close':
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
    };

    window.addEventListener('message', handleMessage);

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'ready' }, '*');
    }

    if (onReady) {
      onReady();
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onReady]);

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

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleConsent = () => {
    setPrivacySettings(prev => ({ ...prev, consentGiven: true }));
    window.parent.postMessage({
      type: 'privacy',
      action: 'giveConsent',
    }, '*');
  };

  return {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
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
  };
}
