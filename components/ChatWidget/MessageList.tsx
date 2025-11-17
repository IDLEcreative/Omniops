import { RefObject, useState } from 'react';
import { Message } from '@/types';
import { MessageContent } from '@/components/chat/MessageContent';
import { ShoppingFeed } from '@/components/shopping/ShoppingFeed';

export interface MessageListProps {
  messages: Message[];
  loading: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  // Configuration-driven styling props
  appearance?: {
    messageAreaBackgroundColor?: string;
    userMessageBackgroundColor?: string;
    userMessageTextColor?: string;
    botMessageTextColor?: string;
  };
  // Context for recommendations
  sessionId?: string;
  conversationId?: string;
  storeDomain?: string | null;
}

export function MessageList({
  messages,
  loading,
  highContrast,
  fontSize,
  messagesContainerRef,
  appearance,
  sessionId,
  conversationId,
  storeDomain,
}: MessageListProps) {
  // CRITICAL DEBUG: Log on EVERY render
  console.log('[MessageList] ⚡ RENDER TRIGGERED - Message count:', messages.length);
  console.log('[MessageList] ⚡ Last message:', messages[messages.length - 1]);

  // Log messages metadata for debugging
  console.log('[MessageList] 🎨 Rendering with messages:', {
    count: messages.length,
    messagesWithMetadata: messages.filter(m => m.metadata && Object.keys(m.metadata).length > 0).length,
    allMessages: messages.map(m => ({
      role: m.role,
      hasMetadata: !!m.metadata,
      metadataKeys: m.metadata ? Object.keys(m.metadata) : [],
      shoppingProducts: m.metadata?.shoppingProducts?.length || 0,
      metadata: m.metadata
    }))
  });

  // Shopping mode state
  const [shoppingMode, setShoppingMode] = useState(false);
  const [shoppingData, setShoppingData] = useState<{
    products: any[];
    context?: string;
  } | null>(null);

  // Use config-driven colors with fallbacks to current hardcoded values
  const messageAreaBgColor = appearance?.messageAreaBackgroundColor || '#111111';
  const userMessageBgColor = appearance?.userMessageBackgroundColor || '#3f3f46';
  const userMessageTextColor = appearance?.userMessageTextColor || '#ffffff';
  const botMessageTextColor = appearance?.botMessageTextColor || '#ffffff';

  // Handler to open shopping mode from message
  const handleOpenShopping = (products: any[], context?: string) => {
    setShoppingData({ products, context });
    setShoppingMode(true);
  };

  // Handler to close shopping mode
  const handleCloseShopping = () => {
    setShoppingMode(false);
    setShoppingData(null);
  };

  return (
    <>
      {/* Shopping Mode Overlay */}
      {shoppingMode && shoppingData && (
        <ShoppingFeed
          products={shoppingData.products}
          onExit={handleCloseShopping}
          onProductView={(productId) => {
            console.log('[Shopping] Product viewed:', productId);
          }}
          onAddToCart={(productId) => {
            console.log('[Shopping] Product added to cart:', productId);
          }}
          sessionId={sessionId}
          conversationId={conversationId}
          storeDomain={storeDomain}
        />
      )}

      {/* Main Chat Messages */}
      <div
        ref={messagesContainerRef}
        style={{
          backgroundColor: highContrast ? undefined : messageAreaBgColor,
        }}
        className={`flex-1 min-h-0 px-2 sm:px-3 py-3 overflow-y-auto overflow-x-hidden overscroll-contain ${highContrast ? 'bg-black' : ''}`}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
      {messages.length === 0 && (
        <div className="flex items-center justify-center min-h-[100px]">
          <p className={`${highContrast ? 'text-white' : 'text-gray-400'} ${
            fontSize === 'xlarge' ? 'text-base' : 'text-sm'
          } text-center`}>
            Hello! How can we help you today?
          </p>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={message.id}
          className={`mb-4 flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          } animate-in slide-in-from-bottom-2 duration-300`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div
            className={`max-w-[85%] ${
              message.role === 'user' ? 'ml-auto' : 'mr-auto'
            } relative`}
            role="article"
            aria-label={`${message.role === 'user' ? 'You said' : 'Support agent said'}: ${message.content}`}
          >
            <div
              style={{
                backgroundColor: message.role === 'user' && !highContrast ? userMessageBgColor : undefined,
                color: message.role === 'user' && !highContrast ? userMessageTextColor : !highContrast ? botMessageTextColor : undefined,
              }}
              className={`px-4 py-3 break-words overflow-wrap-anywhere relative ${
                fontSize === 'xlarge' ? 'text-lg' : fontSize === 'large' ? 'text-base' : 'text-sm'
              } ${
                message.role === 'user'
                  ? 'rounded-2xl rounded-br-md'
                  : ''
              } ${highContrast ? 'text-white' : ''}`}
            >
              <MessageContent content={message.content} className="leading-relaxed break-words" />

              {/* DEBUG INDICATOR - Will show in screenshot */}
              {message.role === 'assistant' && (
                <div style={{
                  padding: '4px 8px',
                  margin: '8px 0',
                  fontSize: '10px',
                  border: '2px solid red',
                  backgroundColor: 'yellow',
                  color: 'black',
                  fontFamily: 'monospace'
                }}>
                  DEBUG: metadata={!!message.metadata ? 'YES' : 'NO'} |
                  shoppingProducts={!!message.metadata?.shoppingProducts ? 'YES' : 'NO'} |
                  count={message.metadata?.shoppingProducts?.length || 0}
                </div>
              )}

              {/* Shopping Button - Show if message has shopping products */}
              {(() => {
                if (message.role === 'assistant') {
                  console.log('[MessageList] Assistant message metadata:', {
                    hasMetadata: !!message.metadata,
                    metadata: message.metadata,
                    hasShoppingProducts: !!message.metadata?.shoppingProducts,
                    productCount: message.metadata?.shoppingProducts?.length
                  });
                }
                return null;
              })()}
              {message.metadata?.shoppingProducts && message.metadata.shoppingProducts.length > 0 && (
                <button
                  data-testid="browse-products-button"
                  onClick={() => handleOpenShopping(
                    message.metadata!.shoppingProducts!,
                    message.metadata?.shoppingContext
                  )}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-medium text-sm hover:bg-gray-100 transition-colors"
                >
                  <span>Browse {message.metadata.shoppingProducts.length} Products</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
            {/* Chat bubble tail - only for user messages */}
            {message.role === 'user' && (
              <div
                style={{
                  backgroundColor: highContrast ? undefined : userMessageBgColor,
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
                }}
                className="absolute bottom-0 right-0 w-3 h-3"
                aria-hidden="true"
              />
            )}
            <span className="sr-only">
              Sent at {new Date(message.created_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}

      {loading && (
        <div className="mb-4 flex justify-start animate-in fade-in duration-300" role="status" aria-live="polite">
          <div className="max-w-[85%] mr-auto">
            <span className="sr-only">Support agent is typing</span>
            <div className="flex gap-1.5 items-center px-2 py-1" aria-hidden="true">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
