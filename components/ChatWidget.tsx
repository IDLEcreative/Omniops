/**
 * ChatWidget Component - AI-optimized header for fast comprehension
 *
 * @purpose Main embeddable chat widget - handles UI state, message sending, and user interactions
 *
 * @flow
 *   1. Mount → useChatState (loads config, session, privacy settings)
 *   2. User types → input state updates
 *   3. User sends → sendChatMessage (POST /api/chat)
 *   4. → Streaming response (OpenAI GPT-4)
 *   5. → Update messages, scroll to bottom
 *   6. → Save to database (conversation persistence)
 *
 * @keyComponents
 *   - Header: Widget header with minimize, contrast, settings buttons
 *   - MessageList: Scrollable message history with auto-scroll
 *   - InputArea: Text input with submit button, loading states
 *   - PrivacyBanner: GDPR consent banner (if required)
 *   - MinimizedButton: Floating button when widget is minimized
 *
 * @stateManagement
 *   - useChatState: Core state (messages, config, session, privacy)
 *   - messages: Message[] (conversation history)
 *   - loading: boolean (AI processing state)
 *   - isOpen: boolean (widget minimized/expanded)
 *   - conversationId: string (persistence key)
 *   - iconState: IconState (normal/hover/active for button animations)
 *
 * @handles
 *   - Message sending: sendChatMessage to /api/chat with streaming
 *   - Privacy: GDPR consent management, data export/delete
 *   - Accessibility: High contrast mode, font size adjustment, RTL support
 *   - Persistence: Session + conversation restoration
 *   - WooCommerce: Cart tracking integration (if enabled)
 *   - Error recovery: Network failures, rate limiting, service errors
 *
 * @returns
 *   - Expanded: Full chat widget UI (Header + MessageList + InputArea)
 *   - Minimized: Floating button with unread indicator
 *   - Banner: Privacy consent banner (conditional)
 *
 * @consumers
 *   - public/embed.js: Loads widget via iframe
 *   - app/embed/page.tsx: Widget embed container
 *   - app/widget-test/page.tsx: Development testing page
 *
 * @configuration
 *   - Props: demoId, demoConfig, initialOpen, forceClose, privacySettings
 *   - Environment: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * @totalLines 400
 * @estimatedTokens 2,000 (without header), 750 (with header - 62% savings)
 */

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
    console.log('[ChatWidget.sendMessage] 🚀 HANDLER CALLED - input:', input, 'loading:', loading);
    if (!input.trim() || loading) {
      console.log('[ChatWidget.sendMessage] ❌ EARLY RETURN - input empty or loading');
      return;
    }

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
      // SECURITY: Get parent origin from referrer or ancestorOrigins
      const parentOrigin = document.referrer ? new URL(document.referrer).origin :
                           (window.location.ancestorOrigins && window.location.ancestorOrigins[0]) || '*';
      window.parent.postMessage({
        type: 'analytics',
        event: 'message_sent',
        label: 'user',
      }, parentOrigin);
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
        console.log('[ChatWidget] 📨 onSuccess called with message:', {
          hasMetadata: !!assistantMessage.metadata,
          productCount: assistantMessage.metadata?.shoppingProducts?.length || 0,
          fullMessage: assistantMessage
        });
        if (!conversationId && newConversationId) {
          setConversationId(newConversationId);
        }
        setMessages(prev => {
          console.log('[ChatWidget] 🔄 setMessages - Adding message to state:', {
            currentStateLength: prev.length,
            newMessageId: assistantMessage.id,
            hasMetadata: !!assistantMessage.metadata,
            productCount: assistantMessage.metadata?.shoppingProducts?.length || 0
          });
          return [...prev, assistantMessage];
        });
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
      sm:bottom-5 sm:w-[400px] sm:h-[600px] sm:max-h-[calc(100dvh-40px)] sm:right-5 sm:mx-0
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
        sessionId={sessionId}
        conversationId={conversationId}
        storeDomain={storeDomain}
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
