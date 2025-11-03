import { RefObject } from 'react';
import { Message } from '@/types';
import { MessageContent } from '@/components/chat/MessageContent';

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
}

export function MessageList({
  messages,
  loading,
  highContrast,
  fontSize,
  messagesContainerRef,
  appearance,
}: MessageListProps) {
  // Use config-driven colors with fallbacks to current hardcoded values
  const messageAreaBgColor = appearance?.messageAreaBackgroundColor || '#111111';
  const userMessageBgColor = appearance?.userMessageBackgroundColor || '#3f3f46';
  const userMessageTextColor = appearance?.userMessageTextColor || '#ffffff';
  const botMessageTextColor = appearance?.botMessageTextColor || '#ffffff';

  return (
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
  );
}
