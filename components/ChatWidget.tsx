'use client';

import { useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { Message } from '@/types';
import { useChatState, ChatWidgetConfig, PrivacySettings } from './ChatWidget/hooks/useChatState';
import { Header } from './ChatWidget/Header';
import { MessageList } from './ChatWidget/MessageList';
import { InputArea } from './ChatWidget/InputArea';
import { PrivacyBanner } from './ChatWidget/PrivacyBanner';

interface ChatWidgetProps {
  demoId?: string;
  demoConfig?: ChatWidgetConfig | null;
  initialOpen?: boolean;
  forceClose?: boolean;
  privacySettings?: Partial<PrivacySettings>;
  onReady?: () => void;
  onMessage?: (message: Message) => void;
}

export default function ChatWidget({
  demoId = '',
  demoConfig = null,
  initialOpen = false,
  forceClose = false,
  privacySettings: propPrivacySettings,
  onReady,
  onMessage: onMessageCallback
}: ChatWidgetProps) {
  const {
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
    onMessage: onMessageFromHook,
  } = useChatState({
    demoId,
    demoConfig,
    initialOpen,
    forceClose,
    privacySettings: propPrivacySettings,
    onReady,
    onMessage: onMessageCallback,
  });

  // Performance: Memoized to prevent recreation on every render
  // and maintain stable reference for InputArea child component
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    if (privacySettings.requireConsent && !privacySettings.consentGiven) {
      alert('Please accept our privacy policy before starting a conversation.');
      return;
    }

    const userMessage = input;
    setInput('');
    setLoading(true);

    const tempUserMessage: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    if (onMessageFromHook) {
      onMessageFromHook(tempUserMessage);
    }

    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'analytics',
        event: 'message_sent',
        label: 'user',
      }, '*');
    }

    try {
      // First check if domain is provided via demoConfig (for dashboard preview)
      let domain = (demoConfig as any)?.domain;

      console.log('[ChatWidget] Domain from demoConfig:', domain);
      console.log('[ChatWidget] Full demoConfig:', demoConfig);

      // If not provided, use URL params or hostname
      if (!domain) {
        const urlParams = new URLSearchParams(window.location.search);
        domain = urlParams.get('domain') || window.location.hostname;

        const isDemoEnvironment =
          domain === 'localhost' ||
          domain === '127.0.0.1';

        if (isDemoEnvironment) {
          const DEMO_DOMAIN = process.env.NEXT_PUBLIC_DEMO_DOMAIN || 'demo.example.com';
          domain = DEMO_DOMAIN;
        }
      }

      console.log('[ChatWidget] Final domain being used:', domain);
      console.log('[ChatWidget] storeDomain value:', storeDomain);
      console.log('[ChatWidget] About to send to API - domain:', storeDomain || domain);

      const chatConfig = {
        features: {
          websiteScraping: { enabled: true },
          woocommerce: { enabled: woocommerceEnabled },
          ...(demoConfig?.features || {})
        },
        ...demoConfig
      };

      // Build API URL - use serverUrl from config if available (for embedded widgets)
      const apiUrl = demoConfig?.serverUrl
        ? `${demoConfig.serverUrl}/api/chat`
        : '/api/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId && conversationId.length > 0 ? conversationId : undefined,
          session_id: sessionId,
          domain: storeDomain || domain,
          demoId: demoId || undefined,
          config: chatConfig,
        }),
      });

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned an invalid response format. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: Message = {
        id: data.id || `temp_${Date.now()}_assistant`,
        conversation_id: data.conversation_id,
        role: 'assistant',
        content: data.message || data.content,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (onMessageFromHook) {
        onMessageFromHook(assistantMessage);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, privacySettings.requireConsent, privacySettings.consentGiven, conversationId, setInput, setLoading, setMessages, onMessageFromHook, sessionId, storeDomain, demoId, demoConfig, woocommerceEnabled, setConversationId]);

  // Performance: Memoized to prevent recreation on every render
  // and maintain stable reference for InputArea child component
  const handleFontSizeChange = useCallback(() => {
    const sizes: Array<'normal' | 'large' | 'xlarge'> = ['normal', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(fontSize);
    setFontSize(sizes[(currentIndex + 1) % sizes.length] || 'normal');
  }, [fontSize, setFontSize]);

  if (!mounted) {
    return null;
  }

  if (privacySettings.requireConsent && !privacySettings.consentGiven && isOpen) {
    return (
      <PrivacyBanner
        retentionDays={privacySettings.retentionDays}
        onAccept={handleConsent}
        onCancel={() => setIsOpen(false)}
      />
    );
  }

  if (!isOpen) {
    // Animation settings with sensible defaults
    const showPulse = demoConfig?.appearance?.showPulseAnimation ?? true;
    const showBadge = demoConfig?.appearance?.showNotificationBadge ?? true;

    return (
      <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 flex items-center justify-center animate-in fade-in group"
          aria-label="Open chat support widget"
          role="button"
          tabIndex={0}
        >
          {/* Subtle pulse animation ring - respects user preference and configuration */}
          {showPulse && (
            <span
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] opacity-75 animate-ping motion-reduce:animate-none"
              style={{ animationDuration: '3s' }}
              aria-hidden="true"
            />
          )}

          {/* Notification dot badge - can be disabled via config */}
          {showBadge && (
            <span
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}

          {/* Icon with hover scale effect */}
          <MessageCircle className="relative h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-0 right-0 w-full h-full
      sm:bottom-5 sm:w-[400px] sm:h-[580px] sm:max-h-[calc(100vh-40px)] sm:right-5 sm:mx-0
      ${highContrast ? 'bg-black border-2 border-white' : 'bg-[#1F2937]'}
      rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 z-50 ${
      isOpen ? 'animate-in slide-in-from-bottom-3 fade-in' : 'animate-out slide-out-to-bottom-3 fade-out'
    }`}
      role="dialog"
      aria-label="Chat support widget"
      aria-modal="true"
    >
      <Header
        headerTitle={demoConfig?.headerTitle || demoConfig?.appearance?.headerTitle}
        headerSubtitle={demoConfig?.appearance?.headerSubtitle}
        primaryColor={demoConfig?.appearance?.primaryColor || '#818CF8'}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        onClose={() => setIsOpen(false)}
      />

      <MessageList
        messages={messages}
        loading={loading}
        highContrast={highContrast}
        fontSize={fontSize}
        messagesContainerRef={messagesContainerRef}
      />

      <InputArea
        input={input}
        loading={loading}
        highContrast={highContrast}
        fontSize={fontSize}
        textareaRef={textareaRef}
        onInputChange={setInput}
        onSend={sendMessage}
        onFontSizeChange={handleFontSizeChange}
      />
    </div>
  );
}
