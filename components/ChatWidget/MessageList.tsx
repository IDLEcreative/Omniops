import { RefObject } from 'react';
import { Message } from '@/types';
import { MessageContent } from '@/components/chat/MessageContent';

export interface MessageListProps {
  messages: Message[];
  loading: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  messagesContainerRef: RefObject<HTMLDivElement | null>;
}

export function MessageList({
  messages,
  loading,
  highContrast,
  fontSize,
  messagesContainerRef,
}: MessageListProps) {
  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 min-h-0 px-2 sm:px-3 py-3 bg-transparent overflow-y-auto overflow-x-hidden overscroll-contain"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.length === 0 && (
        <div className="flex items-center justify-center min-h-[100px]">
          <p className={`${highContrast ? 'text-white' : 'text-gray-300'} ${
            fontSize === 'xlarge' ? 'text-base' : 'text-sm'
          } text-center`}>
            Hello! How can we help you today?
          </p>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={message.id}
          className={`mb-3 flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          } animate-in slide-in-from-bottom-2 duration-300`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div
            className={`max-w-[80%] ${
              message.role === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
            role="article"
            aria-label={`${message.role === 'user' ? 'You said' : 'Support agent said'}: ${message.content}`}
          >
            <div
              className={`px-4 py-2.5 break-words overflow-wrap-anywhere overflow-visible no-scrollbar ${
                fontSize === 'xlarge' ? 'text-lg' : fontSize === 'large' ? 'text-base' : 'text-sm'
              } ${
                message.role === 'user'
                  ? highContrast
                    ? 'bg-white text-black font-medium rounded-2xl rounded-tr-md'
                    : 'bg-gradient-to-br from-[#4a4a4a] to-[#3a3a3a] text-white rounded-2xl rounded-tr-md shadow-md'
                  : highContrast
                    ? 'bg-black text-white border-2 border-white rounded-2xl rounded-tl-md'
                    : 'bg-[#1a1a1a] text-gray-200 rounded-2xl rounded-tl-md shadow-sm'
              }`}
            >
              <MessageContent content={message.content} className="leading-relaxed break-words" />
            </div>
            <span className="sr-only">
              Sent at {new Date(message.created_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}

      {loading && (
        <div className="mb-3 flex justify-start" role="status" aria-live="polite">
          <div className="max-w-[80%] mr-auto">
            <span className="sr-only">Support agent is typing</span>
            <div className={`px-4 py-2.5 inline-block ${
              highContrast
                ? 'bg-black text-white border-2 border-white rounded-2xl rounded-tl-md'
                : 'bg-[#1a1a1a] text-gray-200 rounded-2xl rounded-tl-md shadow-sm'
            }`}>
              <div className="flex gap-1 items-center" aria-hidden="true">
                <div className={`w-2 h-2 ${highContrast ? 'bg-white' : 'bg-gray-400'} rounded-full animate-typing-bounce`} />
                <div className={`w-2 h-2 ${highContrast ? 'bg-white' : 'bg-gray-400'} rounded-full animate-typing-bounce [animation-delay:200ms]`} />
                <div className={`w-2 h-2 ${highContrast ? 'bg-white' : 'bg-gray-400'} rounded-full animate-typing-bounce [animation-delay:400ms]`} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
