import { RefObject, useEffect } from 'react';
import { Send, Type } from 'lucide-react';

export interface InputAreaProps {
  input: string;
  loading: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFontSizeChange: () => void;
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
}: InputAreaProps) {
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
    <div className={`px-3 sm:px-4 py-3 ${highContrast ? 'border-t-2 border-white' : 'border-t border-white/10'}`}>
      <div className="flex gap-2 items-end">
        <label htmlFor="chat-input" className="sr-only">Type your message</label>
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          disabled={loading}
          aria-label="Message input"
          rows={1}
          style={{ height: '40px', minHeight: '40px', maxHeight: '120px' }}
          className={`flex-1 px-4 py-2 resize-none overflow-hidden ${
            fontSize === 'xlarge' ? 'text-lg' : fontSize === 'large' ? 'text-base' : 'text-sm'
          } ${
            highContrast
              ? 'bg-black border-2 border-white text-white placeholder:text-gray-300 focus:border-yellow-400 rounded-2xl'
              : 'bg-[#262626] border-0 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-white/20 rounded-2xl'
          } focus:outline-none transition-all duration-200 leading-normal`}
        />
        <button
          onClick={onFontSizeChange}
          className={`h-10 w-10 flex items-center justify-center rounded-full flex-shrink-0 ${highContrast ? 'text-white hover:bg-white hover:text-black border border-white' : 'text-white hover:opacity-70'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50`}
          aria-label={`Change text size. Current: ${fontSize}`}
          title="Change text size"
        >
          <Type className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          onClick={onSend}
          disabled={!input.trim() || loading}
          aria-label="Send message"
          className={`h-10 w-10 flex items-center justify-center rounded-full flex-shrink-0 ${
            highContrast
              ? 'bg-white text-black hover:bg-gray-200 disabled:bg-gray-600'
              : 'bg-gradient-to-br from-[#4a4a4a] to-[#3a3a3a] hover:from-[#5a5a5a] hover:to-[#4a4a4a] text-white disabled:opacity-30 shadow-md hover:shadow-lg'
          } transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50`}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
