import { useEffect, useCallback } from 'react';

export interface UseParentCommunicationProps {
  conversationId: string;
  isOpen: boolean;
  sessionId: string;
  mounted: boolean;
  setPrivacySettings: React.Dispatch<React.SetStateAction<any>>;
  setWoocommerceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setStoreDomain: React.Dispatch<React.SetStateAction<string | null>>;
  setSessionId: React.Dispatch<React.SetStateAction<string>>;
  setConversationId: (id: string) => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  cleanupOldMessages: (retentionDays: number) => void;
  onReady?: () => void;
}

/**
 * Manages communication with parent window via postMessage
 * Handles widget open/close, resize requests, and data synchronization
 */
export function useParentCommunication({
  conversationId,
  isOpen,
  sessionId,
  mounted,
  setPrivacySettings,
  setWoocommerceEnabled,
  setStoreDomain,
  setSessionId,
  setConversationId,
  setIsOpen,
  setInput,
  cleanupOldMessages,
  onReady,
}: UseParentCommunicationProps): void {
  // Create memoized message handler
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Debug logging (can be enabled via ChatWidgetDebug global)
      if (typeof window !== 'undefined' && (window as any).ChatWidgetDebug) {
        console.log('[Chat Widget] Received message:', event.data.type, 'from', event.origin);
      }

      switch (event.data?.type) {
        case 'init':
          if (event.data.privacyPrefs) {
            setPrivacySettings((prev: any) => ({
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
            const { sessionId: storedSessionId, conversationId: storedConversationId, widgetOpen } =
              event.data.storedData;

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
    },
    [
      conversationId,
      isOpen,
      sessionId,
      setPrivacySettings,
      setWoocommerceEnabled,
      setStoreDomain,
      setSessionId,
      setConversationId,
      setIsOpen,
      setInput,
      cleanupOldMessages,
    ]
  );

  // Set up parent window communication
  useEffect(() => {
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
  }, [handleMessage, onReady]);

  // Notify parent window when widget opens/closes and request resize
  useEffect(() => {
    if (mounted && window.parent !== window) {
      const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      if (isOpen) {
        // Widget is open - request full size and enable pointer events
        window.parent.postMessage({ type: 'widgetOpened' }, targetOrigin);
        window.parent.postMessage(
          {
            type: 'resize',
            width: 400, // Full width for open widget
            height: 580, // Full height for open widget
          },
          targetOrigin
        );
      } else {
        // Widget is closed - request minimal size for button only
        window.parent.postMessage({ type: 'widgetClosed' }, targetOrigin);
        window.parent.postMessage(
          {
            type: 'resize',
            width: 64, // Just enough for the button (14 * 4 + padding)
            height: 64, // Just enough for the button
          },
          targetOrigin
        );
      }
    }
  }, [isOpen, mounted]);
}
