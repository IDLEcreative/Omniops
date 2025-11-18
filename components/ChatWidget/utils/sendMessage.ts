/**
 * Send Message Utility
 *
 * Handles the chat message sending logic including:
 * - API communication
 * - Session tracking
 * - Error handling
 */

import { Message } from '@/types';
import { getSessionTracker } from '@/lib/analytics/session-tracker';
import { ChatWidgetConfig } from '../hooks/useChatState';

interface SendMessageParams {
  userMessage: string;
  conversationId: string;
  sessionId: string;
  storeDomain: string | null;
  demoId: string;
  demoConfig: ChatWidgetConfig | null;
  woocommerceEnabled: boolean;
  onSuccess: (assistantMessage: Message, conversationId?: string) => void;
  onError: (errorMessage: Message) => void;
}

export async function sendChatMessage({
  userMessage,
  conversationId,
  sessionId,
  storeDomain,
  demoId,
  demoConfig,
  woocommerceEnabled,
  onSuccess,
  onError,
}: SendMessageParams): Promise<void> {
  try {
    // First check if domain is provided via demoConfig (for dashboard preview)
    let domain = (demoConfig as any)?.domain;


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

    // Get session tracking data if available
    let sessionMetadata;
    try {
      const sessionTracker = getSessionTracker(storeDomain || domain);
      sessionMetadata = sessionTracker.exportData();
    } catch (error) {
      console.warn('[ChatWidget] Could not export session data:', error);
    }

    // Detect mobile device on client side
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
        session_metadata: sessionMetadata,
        is_mobile: isMobile, // Pass mobile detection flag from client
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

    console.log('[ChatWidget] 🔍 API response data:', {
      hasShoppingMetadata: !!data.shoppingMetadata,
      productCount: data.shoppingMetadata?.products?.length || 0,
      message: data.message?.substring(0, 50)
    });


    const assistantMessage: Message = {
      id: data.id || `temp_${Date.now()}_assistant`,
      conversation_id: data.conversation_id,
      role: 'assistant',
      content: data.message || data.content,
      created_at: new Date().toISOString(),
      // Transform API's shoppingMetadata to message metadata format
      metadata: data.shoppingMetadata ? {
        shoppingProducts: data.shoppingMetadata.products,
        shoppingContext: data.shoppingMetadata.context,
      } : undefined,
    };

    console.log('[ChatWidget] ✅ Created message with metadata:', {
      hasMetadata: !!assistantMessage.metadata,
      productCount: assistantMessage.metadata?.shoppingProducts?.length || 0,
      fullMetadata: assistantMessage.metadata
    });

    onSuccess(assistantMessage, data.conversation_id);

  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage: Message = {
      id: `error_${Date.now()}`,
      conversation_id: conversationId,
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      created_at: new Date().toISOString(),
    };
    onError(errorMessage);
  }
}
