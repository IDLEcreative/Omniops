'use client';

import { useCallback, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Message } from '@/types';
import { useChatState, ChatWidgetConfig, PrivacySettings } from './ChatWidget/hooks/useChatState';
import { Header } from './ChatWidget/Header';
import { MessageList } from './ChatWidget/MessageList';
import { InputArea } from './ChatWidget/InputArea';
import { PrivacyBanner } from './ChatWidget/PrivacyBanner';
import { AnimationStyles, getAnimationClassName } from '@/app/dashboard/customize/components/AnimationStyles';

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
  const [iconState, setIconState] = useState<'normal' | 'hover' | 'active'>('normal');

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

  // Get the appropriate icon URL based on current state
  const getIconUrl = useCallback(() => {
    const normalIcon = demoConfig?.branding?.minimizedIconUrl || demoConfig?.appearance?.minimizedIconUrl;
    const hoverIcon = demoConfig?.branding?.minimizedIconHoverUrl || demoConfig?.appearance?.minimizedIconHoverUrl;
    const activeIcon = demoConfig?.branding?.minimizedIconActiveUrl || demoConfig?.appearance?.minimizedIconActiveUrl;

    switch (iconState) {
      case 'hover':
        return hoverIcon || normalIcon;
      case 'active':
        return activeIcon || normalIcon;
      default:
        return normalIcon;
    }
  }, [iconState, demoConfig]);

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
    const animationType = demoConfig?.behavior?.animationType || 'pulse';
    const animationSpeed = demoConfig?.behavior?.animationSpeed || 'normal';
    const animationIntensity = demoConfig?.behavior?.animationIntensity || 'normal';
    const showBadge = demoConfig?.appearance?.showNotificationBadge ?? true;

    // Config-driven button colors and icon
    const buttonGradientStart = demoConfig?.appearance?.buttonGradientStart || '#3a3a3a';
    const buttonGradientEnd = demoConfig?.appearance?.buttonGradientEnd || '#2a2a2a';
    const buttonTextColor = demoConfig?.appearance?.buttonTextColor || '#ffffff';
    const minimizedIconUrl = getIconUrl();

    return (
      <div className="fixed bottom-1 right-1 z-50">
        {/* Inject animation styles if animation is enabled */}
        {animationType !== 'none' && (
          <AnimationStyles
            animationType={animationType}
            animationSpeed={animationSpeed}
            animationIntensity={animationIntensity}
          />
        )}
        <button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIconState('hover')}
          onMouseLeave={() => setIconState('normal')}
          onMouseDown={() => setIconState('active')}
          onMouseUp={() => setIconState('hover')}
          onTouchStart={() => setIconState('active')}
          onTouchEnd={() => setIconState('normal')}
          style={{
            backgroundImage: `linear-gradient(to bottom right, ${buttonGradientStart}, ${buttonGradientEnd})`,
            color: buttonTextColor,
          }}
          className={`relative w-12 h-12 sm:w-14 sm:h-14 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 flex items-center justify-center animate-in fade-in group ${getAnimationClassName(animationType)}`}
          aria-label="Open chat support widget"
          role="button"
          tabIndex={0}
        >
          {/* Legacy pulse ring - only show if animationType is 'none' for backwards compatibility */}
          {animationType === 'none' && (
            <span
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${buttonGradientStart}, ${buttonGradientEnd})`,
                animationDuration: '3s',
              }}
              className="absolute inset-0 rounded-full opacity-75 animate-ping motion-reduce:animate-none"
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

          {/* Icon with hover scale effect and smooth state transitions */}
          {minimizedIconUrl ? (
            <picture
              key={iconState}
              className="relative h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-all duration-200 ease-in-out block"
            >
              {/* WebP version for modern browsers (better compression) */}
              <source
                srcSet={minimizedIconUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp')}
                type="image/webp"
              />
              {/* PNG fallback for older browsers */}
              <img
                src={minimizedIconUrl.replace(/\.webp$/i, '.png')}
                alt="Chat"
                className="h-full w-full object-contain transition-opacity duration-200"
                width="24"
                height="24"
                loading="lazy"
                aria-hidden="true"
                style={{
                  opacity: iconState === 'active' ? 0.8 : 1,
                }}
                onError={(e) => {
                  // Fallback to default MessageCircle icon on error
                  const picture = e.currentTarget.closest('picture');
                  if (picture) {
                    picture.style.display = 'none';
                  }
                  const button = picture?.parentElement;
                  if (button) {
                    const fallbackIcon = document.createElement('div');
                    fallbackIcon.innerHTML = '<svg class="relative h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>';
                    button.appendChild(fallbackIcon.firstChild as Node);
                  }
                }}
              />
            </picture>
          ) : (
            <MessageCircle className="relative h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
          )}
        </button>
      </div>
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
