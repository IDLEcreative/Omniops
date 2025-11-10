'use client';

import { useCallback, useState } from 'react';
import { Message } from '@/types';
import { useChatState, ChatWidgetConfig, PrivacySettings } from './ChatWidget/hooks/useChatState';
import { Header } from './ChatWidget/Header';
import { MessageList } from './ChatWidget/MessageList';
import { InputArea } from './ChatWidget/InputArea';
import { PrivacyBanner } from './ChatWidget/PrivacyBanner';
import { MinimizedButton } from './ChatWidget/MinimizedButton';
import { sendChatMessage } from './ChatWidget/utils/sendMessage';
import { IconState } from './ChatWidget/utils/iconUtils';

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
  // Icon state management for hover and active states
  const [iconState, setIconState] = useState<IconState>('normal');

  const {
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
    sessionLoading,
    sessionError,
    isOpen,
    setIsOpen,
    mounted,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    isRTL,
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

    await sendChatMessage({
      userMessage,
      conversationId,
      sessionId,
      storeDomain,
      demoId,
      demoConfig,
      woocommerceEnabled,
      onSuccess: (assistantMessage, newConversationId) => {
        if (!conversationId && newConversationId) {
          setConversationId(newConversationId);
        }
        setMessages(prev => [...prev, assistantMessage]);
        if (onMessageFromHook) {
          onMessageFromHook(assistantMessage);
        }
      },
      onError: (errorMessage) => {
        setMessages(prev => [...prev, errorMessage]);
      },
    });

    setLoading(false);
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

  // Show loading state while session is initializing
  if (sessionLoading) {
    return null; // Don't show anything until session is ready
  }

  // Show error if session failed to initialize (gracefully degrades with in-memory session)
  if (sessionError && isOpen) {
    console.warn('[ChatWidget] Session initialization error (using fallback):', sessionError);
    // Continue rendering - the hook provides a fallback in-memory session
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
    return (
      <MinimizedButton
        demoConfig={demoConfig}
        iconState={iconState}
        onOpen={() => setIsOpen(true)}
        onIconStateChange={setIconState}
      />
    );
  }

  // Config-driven widget container colors
  const widgetBgColor = demoConfig?.appearance?.widgetBackgroundColor || '#111111';
  const widgetBorderColor = demoConfig?.appearance?.widgetBorderColor || '#2a2a2a';

  return (
    <div
      style={{
        backgroundColor: highContrast ? undefined : widgetBgColor,
        borderColor: highContrast ? undefined : widgetBorderColor,
      }}
      className={`fixed bottom-0 right-0 w-full h-full
      sm:bottom-5 sm:w-[400px] sm:h-[580px] sm:max-h-[calc(100vh-40px)] sm:right-5 sm:mx-0
      ${highContrast ? 'bg-black border-2 border-white' : 'border'}
      rounded-lg shadow-lg flex flex-col overflow-hidden transition-all duration-200 z-50 ${
      isOpen ? 'animate-in slide-in-from-bottom-3 fade-in' : 'animate-out slide-out-to-bottom-3 fade-out'
    }`}
      role="dialog"
      aria-label="Chat support widget"
      aria-modal="true"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Header
        headerTitle={demoConfig?.appearance?.headerTitle || demoConfig?.headerTitle}
        headerSubtitle={demoConfig?.appearance?.headerSubtitle}
        primaryColor={demoConfig?.appearance?.primaryColor || '#818CF8'}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        onClose={() => setIsOpen(false)}
        appearance={demoConfig?.appearance}
      />

      <MessageList
        messages={messages}
        loading={loading || loadingMessages}
        highContrast={highContrast}
        fontSize={fontSize}
        messagesContainerRef={messagesContainerRef}
        appearance={demoConfig?.appearance}
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
        appearance={demoConfig?.appearance}
      />
    </div>
  );
}
