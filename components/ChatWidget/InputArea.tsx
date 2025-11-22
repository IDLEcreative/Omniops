import { RefObject, useEffect, useState } from 'react';
import { Send, Type, UserPlus } from 'lucide-react';
import { useTranslation } from './hooks/useTranslation';

export interface InputAreaProps {
  input: string;
  loading: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFontSizeChange: () => void;
  // Human help request props
  conversationId?: string;
  messageCount?: number;
  humanRequested?: boolean;
  onRequestHuman?: () => Promise<void>;
  // Configuration-driven styling props
  appearance?: {
    inputAreaBackgroundColor?: string;
    inputAreaBorderColor?: string;
    inputBackgroundColor?: string;
    inputBorderColor?: string;
    inputFocusBorderColor?: string;
    inputTextColor?: string;
    inputPlaceholderColor?: string;
    borderRadius?: string;
  };
}

export function InputArea({
  input,
  loading,
  highContrast,
  fontSize,
  textareaRef,
  onInputChange,
  onSend,
  onFontSizeChange,
  conversationId,
  messageCount = 0,
  humanRequested = false,
  onRequestHuman,
  appearance,
}: InputAreaProps) {
  // Translation hook for i18n support
  const { t } = useTranslation();

  // State for human help request
  const [requestingHuman, setRequestingHuman] = useState(false);

  // Show "Request Human Help" button if:
  // - Conversation has started (conversationId exists)
  // - At least 2 messages exchanged (user and bot)
  // - Not already requested
  const showHumanHelpButton = conversationId && messageCount >= 2 && !humanRequested && onRequestHuman;

  // Handle request human help
  const handleRequestHuman = async () => {
    if (!onRequestHuman || requestingHuman) return;

    setRequestingHuman(true);
    try {
      await onRequestHuman();
    } catch (error) {
      console.error('[InputArea] Failed to request human help:', error);
    } finally {
      setRequestingHuman(false);
    }
  };

  // Use config-driven colors with fallbacks to current hardcoded values
  const inputAreaBgColor = appearance?.inputAreaBackgroundColor || '#111111';
  const inputAreaBorderColor = appearance?.inputAreaBorderColor || '#2a2a2a';
  const inputBgColor = appearance?.inputBackgroundColor || '#2a2a2a';
  const inputBorderColor = appearance?.inputBorderColor || '#3a3a3a';
  const inputFocusBorderColor = appearance?.inputFocusBorderColor || '#4a4a4a';
  const inputTextColor = appearance?.inputTextColor || '#ffffff';
  const borderRadius = appearance?.borderRadius || '8';
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Reset textarea height when message is sent
  useEffect(() => {
    if (!input && textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  }, [input, textareaRef]);

  return (
    <div
      style={{
        backgroundColor: highContrast ? undefined : inputAreaBgColor,
        borderColor: highContrast ? undefined : inputAreaBorderColor,
      }}
      className={`px-3 sm:px-4 py-3 border-t ${highContrast ? 'border-t-2 border-white bg-black' : ''}`}
    >
      {/* Request Human Help Button */}
      {showHumanHelpButton && (
        <button
          onClick={handleRequestHuman}
          disabled={requestingHuman}
          className="w-full mb-2 px-3 py-2 text-xs sm:text-sm flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Request human assistance"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span>{requestingHuman ? t('chat.requestingHuman') : t('chat.requestHuman')}</span>
        </button>
      )}

      <div className="flex gap-2 items-center">
        <label htmlFor="chat-input" className="sr-only">{t('chat.placeholder')}</label>
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyPress}
          placeholder={t('chat.placeholder')}
          disabled={loading}
          aria-label={t('chat.placeholder')}
          rows={1}
          style={{
            height: '40px',
            minHeight: '40px',
            maxHeight: '120px',
            backgroundColor: highContrast ? undefined : inputBgColor,
            borderColor: highContrast ? undefined : inputBorderColor,
            color: highContrast ? undefined : inputTextColor,
            borderRadius: `${borderRadius}px`,
          }}
          className={`flex-1 px-4 py-2.5 resize-none overflow-hidden border font-sans ${
            fontSize === 'xlarge' ? 'text-lg' : fontSize === 'large' ? 'text-base' : 'text-sm'
          } ${
            highContrast
              ? 'bg-black border-2 border-white text-white placeholder:text-gray-300 focus:border-yellow-400'
              : 'placeholder:text-gray-500'
          } focus:outline-none transition-all duration-200 leading-relaxed`}
          onFocus={(e) => {
            if (!highContrast) {
              e.target.style.borderColor = inputFocusBorderColor;
            }
          }}
          onBlur={(e) => {
            if (!highContrast) {
              e.target.style.borderColor = inputBorderColor;
            }
          }}
        />
        <button
          onClick={onFontSizeChange}
          className="p-2 flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none bg-transparent border-0 rounded-md hover:bg-gray-800/50"
          aria-label={`Change text size. Current: ${fontSize}`}
          title="Change text size"
        >
          <Type className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          onClick={() => {
            console.log('[InputArea] 🖱️ SEND BUTTON CLICKED - input:', input, 'loading:', loading, 'disabled:', !input.trim() || loading);
            onSend();
          }}
          disabled={!input.trim() || loading}
          aria-label={t('chat.send')}
          className="p-2 flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-white disabled:opacity-30 transition-colors duration-200 focus:outline-none bg-transparent border-0 rounded-md hover:bg-gray-800/50 disabled:hover:bg-transparent"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
