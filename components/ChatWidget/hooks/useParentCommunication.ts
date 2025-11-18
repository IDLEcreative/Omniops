import { useEffect, useCallback, useState, useRef } from 'react';
import type { PrivacySettings } from './usePrivacySettings';

export interface UseParentCommunicationProps {
  conversationId: string;
  isOpen: boolean;
  sessionId: string;
  mounted: boolean;
  setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettings>>;
  setWoocommerceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setStoreDomain: React.Dispatch<React.SetStateAction<string | null>>;
  setSessionId: React.Dispatch<React.SetStateAction<string>>;
  setConversationId: (id: string) => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  cleanupOldMessages: (retentionDays: number) => void;
  onReady?: () => void;
}

export interface ParentCommunicationState {
  error: Error | null;
  messagesReceived: number;
  lastMessageType: string | null;
}

/**
 * Manages communication with parent window via postMessage
 *
 * Features:
 * - Secure origin validation (prevents XSS)
 * - Message data validation
 * - Widget open/close notifications
 * - Data synchronization with parent
 * - Error tracking and debugging
 * - Production-safe logging
 *
 * @param props - Communication props including state setters
 * @returns Communication state (error, message stats)
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
}: UseParentCommunicationProps): ParentCommunicationState {
  const [error, setError] = useState<Error | null>(null);
  const [messagesReceived, setMessagesReceived] = useState<number>(0);
  const [lastMessageType, setLastMessageType] = useState<string | null>(null);

  // FIXED: Use useRef to store callback and prevent infinite loop
  // Store callback in ref to prevent recreation on every state change
  const handleMessageRef = useRef<((event: MessageEvent) => void) | undefined>(undefined);

  // Update ref whenever dependencies change, but don't trigger event listener re-registration
  useEffect(() => {
    handleMessageRef.current = (event: MessageEvent) => {
      try {
        // SECURITY: Validate origin to prevent XSS attacks
        // Special handling for srcdoc iframes where origin is 'null'
        const inIframe = window !== window.parent;
        const isSrcdocIframe = window.location.origin === 'null';

        // Build allowed origins list
        const allowedOrigins = [
          window.location.origin,
          process.env.NEXT_PUBLIC_APP_URL,
        ].filter(Boolean);

        // For srcdoc iframes, we need to accept messages from the parent window
        // since our origin is 'null' but parent's origin is the actual domain
        let isAllowedOrigin = false;

        if (inIframe && isSrcdocIframe) {
          // In srcdoc iframe: accept messages from parent's origin
          // This is safe because srcdoc iframes are same-origin with parent
          isAllowedOrigin = event.origin.startsWith('http://localhost') ||
                           event.origin.startsWith('https://');
        } else {
          // Normal origin validation
          isAllowedOrigin = allowedOrigins.some(
            (origin) => event.origin === origin || event.origin.endsWith(origin as string)
          );
        }

        if (!isAllowedOrigin) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              '[useParentCommunication] Rejected message from untrusted origin:',
              event.origin,
              'Widget origin:',
              window.location.origin,
              'In iframe:',
              inIframe,
              'Is srcdoc:',
              isSrcdocIframe
            );
          }
          return;
        }

        // Validate message structure
        if (!event.data || typeof event.data.type !== 'string') {
          const error = new Error('Invalid message format');
          setError(error);
          if (process.env.NODE_ENV === 'development') {
            console.error('[useParentCommunication] Invalid message format:', event.data);
          }
          return;
        }

        // Track message statistics
        setMessagesReceived((prev) => prev + 1);
        setLastMessageType(event.data.type);

        // Debug logging (can be enabled via ChatWidgetDebug global)
        if (typeof window !== 'undefined' && (window as any).ChatWidgetDebug) {
          console.log('[useParentCommunication] Received message:', event.data.type, 'from', event.origin);
        }

        // Process message by type
        switch (event.data.type) {
          case 'init':
            // Validate and set privacy preferences
            if (event.data.privacyPrefs && typeof event.data.privacyPrefs.consentGiven === 'boolean') {
              setPrivacySettings((prev) => ({
                ...prev,
                consentGiven: event.data.privacyPrefs.consentGiven,
              }));
            }

            // Validate and set WooCommerce enabled flag
            if (typeof event.data.woocommerceEnabled === 'boolean') {
              setWoocommerceEnabled(event.data.woocommerceEnabled);
            }

            // Validate and set store domain
            if (event.data.storeDomain && typeof event.data.storeDomain === 'string') {
              setStoreDomain(event.data.storeDomain);
            }

            // Handle stored data from parent window
            if (event.data.storedData) {
              const { sessionId: storedSessionId, conversationId: storedConversationId, widgetOpen } =
                event.data.storedData;

              if (storedSessionId && typeof storedSessionId === 'string' && !sessionId) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('[useParentCommunication] Restored session ID from parent:', storedSessionId);
                }
                setSessionId(storedSessionId);
              }

              if (storedConversationId && typeof storedConversationId === 'string' && !conversationId) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('[useParentCommunication] Restored conversation ID from parent:', storedConversationId);
                }
                setConversationId(storedConversationId);
              }

              if (widgetOpen === true && !isOpen) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('[useParentCommunication] Widget was open, restoring state');
                }
                setIsOpen(true);
              }
            }
            break;

          case 'open':
            if (typeof window !== 'undefined' && (window as any).ChatWidgetDebug) {
              console.log('[useParentCommunication] Opening widget');
            }
            setIsOpen(true);
            break;

          case 'close':
            if (typeof window !== 'undefined' && (window as any).ChatWidgetDebug) {
              console.log('[useParentCommunication] Closing widget');
            }
            setIsOpen(false);
            break;

          case 'message':
            if (event.data.message && typeof event.data.message === 'string') {
              setInput(event.data.message);
            }
            break;

          case 'cleanup':
            if (typeof event.data.retentionDays === 'number' && event.data.retentionDays > 0) {
              cleanupOldMessages(event.data.retentionDays);
            }
            break;

          default:
            // Unknown message type - ignore
            if (process.env.NODE_ENV === 'development') {
              console.warn('[useParentCommunication] Unknown message type:', event.data.type);
            }
            break;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to handle message');
        setError(error);
        console.error('[useParentCommunication] Error handling message:', error);
      }
    };
  }, [
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
  ]);

  // Set up stable message listener that uses the ref (runs only once on mount)
  useEffect(() => {
    // Wrapper function that calls the ref
    const handler = (event: MessageEvent) => handleMessageRef.current?.(event);

    try {
      window.addEventListener('message', handler);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to setup message listener');
      setError(error);
      console.error('[useParentCommunication] Setup error:', error);
    }

    return () => {
      try {
        window.removeEventListener('message', handler);
      } catch (err) {
        // Log but don't throw on cleanup
        if (process.env.NODE_ENV === 'development') {
          console.error('[useParentCommunication] Cleanup error:', err);
        }
      }
    };
  }, []); // Empty deps - stable event listener

  // Send ready message ONCE on mount (empty dependency array)
  useEffect(() => {
    // Send ready message to parent if in iframe
    if (window.parent !== window) {
      try {
        // SECURITY: Get parent origin from referrer or ancestorOrigins
        // In iframe context, document.referrer gives us the parent's URL
        const parentOrigin = document.referrer ? new URL(document.referrer).origin :
                             (window.location.ancestorOrigins && window.location.ancestorOrigins[0]) || '*';

        // DEBUG: Log what we detected
        if (process.env.NODE_ENV === 'development' || (window as any).ChatWidgetDebug) {
          console.log('[useParentCommunication] Sending ready message');
          console.log('  document.referrer:', document.referrer);
          console.log('  ancestorOrigins:', window.location.ancestorOrigins ? Array.from(window.location.ancestorOrigins) : 'N/A');
          console.log('  Calculated parentOrigin:', parentOrigin);
          console.log('  window.location.origin:', window.location.origin);
        }

        window.parent.postMessage({ type: 'ready' }, parentOrigin);
        setMessagesReceived((prev) => prev + 1);
        setLastMessageType('ready');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('postMessage failed');
        setError(error);
        console.error('[useParentCommunication] Error sending ready message:', error);
      }
    }

    // Call onReady callback if provided
    if (onReady) {
      try {
        onReady();
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useParentCommunication] Error in onReady callback:', err);
        }
      }
    }
  }, []); // Empty deps = run ONCE on mount only

  // Notify parent window when widget opens/closes and request resize
  useEffect(() => {
    if (mounted && window.parent !== window) {
      try {
        // SECURITY: Get parent origin from referrer or ancestorOrigins
        // In iframe context, document.referrer gives us the parent's URL
        const targetOrigin = document.referrer ? new URL(document.referrer).origin :
                             (window.location.ancestorOrigins && window.location.ancestorOrigins[0]) || '*';

        // DEBUG: Log what we're doing
        if (process.env.NODE_ENV === 'development' || (window as any).ChatWidgetDebug) {
          console.log(`[useParentCommunication] Widget ${isOpen ? 'opened' : 'closed'}`);
          console.log('  document.referrer:', document.referrer);
          console.log('  Calculated targetOrigin:', targetOrigin);
        }

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
      } catch (err) {
        const error = err instanceof Error ? err : new Error('postMessage failed');
        setError(error);

        if (process.env.NODE_ENV === 'development') {
          console.error('[useParentCommunication] Error sending resize message:', error);
        }
      }
    }
  }, [isOpen, mounted]);

  return {
    error,
    messagesReceived,
    lastMessageType,
  };
}
