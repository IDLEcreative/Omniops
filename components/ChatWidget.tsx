'use client';

import { useState, useEffect, useRef } from 'react';
// Removed ScrollArea to fix double scrollbar issue
import { 
  Send, 
  X, 
  MessageCircle, 
  Shield,
  Eye,
  Type,
  Settings
} from 'lucide-react';
import { Message } from '@/types';
import { MessageContent } from '@/components/chat/MessageContent';

interface ChatWidgetProps {
  // Optional props for customization
  demoId?: string;
  demoConfig?: any;
  initialOpen?: boolean;
  forceClose?: boolean;
  privacySettings?: {
    allowOptOut?: boolean;
    showPrivacyNotice?: boolean;
    requireConsent?: boolean;
    consentGiven?: boolean;
    retentionDays?: number;
  };
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
  onMessage
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [mounted, setMounted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [privacySettings, setPrivacySettings] = useState({
    allowOptOut: true,
    showPrivacyNotice: true,
    requireConsent: false,
    consentGiven: false,
    retentionDays: 30,
    ...propPrivacySettings
  });
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // WooCommerce settings
  const [woocommerceEnabled, setWoocommerceEnabled] = useState(false);
  const [storeDomain, setStoreDomain] = useState<string | null>(null);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse privacy settings from URL params if in embed mode
  useEffect(() => {
    if (typeof window !== 'undefined' && !demoId) {
      const params = new URLSearchParams(window.location.search);
      
      // Check if this is a demo
      const demo = params.get('demo');
      if (demo && !demoId) {
        // Try to load demo config from localStorage
        const storedConfig = localStorage.getItem(`demo_${demo}_config`);
        if (storedConfig && !demoConfig) {
          // This is handled by parent components now
        }
      }
      
      // Parse privacy settings from URL
      const urlPrivacySettings = {
        allowOptOut: params.get('optOut') === 'true',
        showPrivacyNotice: params.get('privacyNotice') === 'true',
        requireConsent: params.get('requireConsent') === 'true',
        consentGiven: params.get('consentGiven') === 'true',
        retentionDays: parseInt(params.get('retentionDays') || '30'),
      };

      // Merge URL settings with prop settings
      setPrivacySettings(prev => ({
        ...prev,
        ...urlPrivacySettings,
        ...propPrivacySettings
      }));

      // Check for force close parameter
      if (params.get('forceClose') === 'true' || forceClose) {
        localStorage.removeItem('chat_widget_open');
        setIsOpen(false);
      } else if (params.get('open') === 'true' || initialOpen) {
        setIsOpen(true);
      }
    }
  }, [demoId, demoConfig, propPrivacySettings, initialOpen, forceClose]);

  // Check localStorage for saved state after mount
  useEffect(() => {
    if (!mounted) return;
    
    const params = new URLSearchParams(window.location.search);
    // Don't override if auto-open or forceClose parameter is set
    if (params.get('open') === 'true' || params.get('forceClose') === 'true' || initialOpen || forceClose) return;
    
    const savedState = localStorage.getItem('chat_widget_open');
    if (savedState === 'true') {
      setIsOpen(true);
    }
  }, [mounted, initialOpen, forceClose]);

  // Save open/close state to localStorage
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('chat_widget_open', isOpen.toString());
    }
  }, [isOpen, mounted]);

  // Generate session ID on mount and check WooCommerce config
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chat_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_session_id', newSessionId);
      setSessionId(newSessionId);
    }
    
    // Check if WooCommerce is enabled for this domain
    const checkWooCommerceConfig = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      // For demo/testing: use thompsonseparts.co.uk for localhost and Vercel deployments
      let domain = urlParams.get('domain') || window.location.hostname;
      
      // Check if this is a demo environment (localhost only)
      const isDemoEnvironment = 
        domain === 'localhost' || 
        domain === '127.0.0.1';
      
      if (isDemoEnvironment) {
        console.log(`[ChatWidget WooCommerce] Using thompsonseparts.co.uk for demo/testing (original: ${urlParams.get('domain') || window.location.hostname})`);
        domain = 'thompsonseparts.co.uk';
      }
      
      try {
        const response = await fetch(`/api/customer/config?domain=${encodeURIComponent(domain)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.config?.woocommerce_enabled) {
            setWoocommerceEnabled(true);
            setStoreDomain(data.config.domain || domain);
          }
        }
      } catch (error) {
        console.log('Could not load WooCommerce config:', error);
      }
    };
    
    checkWooCommerceConfig();

    // Listen for messages from parent window (for embed mode)
    const handleMessage = (event: MessageEvent) => {
      switch (event.data?.type) {
        case 'init':
          // Receive config from parent
          if (event.data.privacyPrefs) {
            setPrivacySettings(prev => ({
              ...prev,
              consentGiven: event.data.privacyPrefs.consentGiven,
            }));
          }
          // Set WooCommerce settings
          if (event.data.woocommerceEnabled !== undefined) {
            setWoocommerceEnabled(event.data.woocommerceEnabled);
          }
          if (event.data.storeDomain) {
            setStoreDomain(event.data.storeDomain);
          }
          break;
        case 'open':
          setIsOpen(true);
          break;
        case 'close':
          setIsOpen(false);
          break;
        case 'message':
          if (event.data.message) {
            setInput(event.data.message);
            sendMessage();
          }
          break;
        case 'cleanup':
          // Clean up old messages based on retention
          cleanupOldMessages(event.data.retentionDays);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Notify parent that widget is ready
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'ready' }, '*');
    }

    // Call onReady callback if provided
    if (onReady) {
      onReady();
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onReady]);

  // Clean up old messages
  const cleanupOldMessages = (retentionDays: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const stored = localStorage.getItem('chat_messages');
    if (stored) {
      const messages = JSON.parse(stored);
      const filtered = messages.filter((msg: Message) => 
        new Date(msg.created_at) > cutoffDate
      );
      localStorage.setItem('chat_messages', JSON.stringify(filtered));
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    // Check consent if required
    if (privacySettings.requireConsent && !privacySettings.consentGiven) {
      alert('Please accept our privacy policy before starting a conversation.');
      return;
    }

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Add user message to UI
    const tempUserMessage: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    // Call onMessage callback if provided
    if (onMessage) {
      onMessage(tempUserMessage);
    }

    // Track event (for embed mode)
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'analytics',
        event: 'message_sent',
        label: 'user',
      }, '*');
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      // For demo/testing: use thompsonseparts.co.uk for localhost and Vercel deployments
      let domain = urlParams.get('domain') || window.location.hostname;
      
      // Check if this is a demo environment (localhost only)
      const isDemoEnvironment = 
        domain === 'localhost' || 
        domain === '127.0.0.1';
      
      if (isDemoEnvironment) {
        domain = 'thompsonseparts.co.uk';
        console.log(`[ChatWidget] Using thompsonseparts.co.uk for demo/testing (original: ${urlParams.get('domain') || window.location.hostname})`);
      }

      // Ensure websiteScraping is enabled for RAG capabilities
      const chatConfig = {
        features: {
          websiteScraping: { enabled: true },
          woocommerce: { enabled: woocommerceEnabled },
          ...(demoConfig?.features || {})
        },
        ...demoConfig
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId || undefined, // Only send if not empty
          session_id: sessionId,
          domain,
          demoId: demoId || undefined,
          config: chatConfig,
          woocommerceEnabled: woocommerceEnabled,
          storeDomain: storeDomain || domain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Update conversation ID if this is the first message
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // Add assistant message to UI
      const assistantMessage: Message = {
        id: data.id || `temp_${Date.now()}_assistant`,
        conversation_id: data.conversation_id,
        role: 'assistant',
        content: data.message || data.content,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Call onMessage callback if provided
      if (onMessage) {
        onMessage(assistantMessage);
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
  };


  const handleConsent = () => {
    setPrivacySettings(prev => ({ ...prev, consentGiven: true }));
    window.parent.postMessage({
      type: 'privacy',
      action: 'giveConsent',
    }, '*');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea as user types
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`; // Max height of 120px
    }
  };

  // Reset textarea height when message is sent
  useEffect(() => {
    if (!input && textareaRef.current) {
      textareaRef.current.style.height = '40px'; // Reset to initial height
    }
  }, [input]);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null;
  }

  // Consent screen if required
  if (privacySettings.requireConsent && !privacySettings.consentGiven && isOpen) {
    return (
      <div className="fixed bottom-0 right-0 w-full h-auto 
        sm:bottom-5 sm:w-[400px] sm:right-5 sm:mx-0
        bg-[#141414] sm:rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-3 duration-200">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Privacy Notice</h3>
              <p className="text-xs text-gray-500">Your data is protected</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            By continuing, you agree to our data processing for support purposes. 
            Data is retained for {privacySettings.retentionDays} days.
          </p>
          <div className="flex gap-2 pt-2">
            <button 
              onClick={handleConsent} 
              className="flex-1 h-10 flex items-center justify-center bg-white text-black hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Accept
            </button>
            <button 
              onClick={() => setIsOpen(false)} 
              className="h-10 px-4 flex items-center justify-center bg-transparent border border-[#2a2a2a] text-gray-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="text-center pt-2 border-t border-[#1a1a1a]">
            <a href="/privacy" target="_blank" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Privacy policy
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 flex items-center justify-center animate-in fade-in"
          aria-label="Open chat support widget"
          role="button"
          tabIndex={0}
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        </button>
      </>
    );
  }

  return (
    <div 
      className={`fixed bottom-0 right-0 w-full h-full 
      sm:bottom-5 sm:w-[400px] sm:h-[580px] sm:max-h-[calc(100vh-40px)] sm:right-5 sm:mx-0
      ${highContrast ? 'bg-black border-2 border-white' : 'bg-[#141414]'} 
      sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
      isOpen ? 'animate-in slide-in-from-bottom-3 fade-in' : 'animate-out slide-out-to-bottom-3 fade-out'
    }`}
      role="dialog"
      aria-label="Chat support widget"
      aria-modal="true">
      {/* Header */}
      <div className={`${highContrast ? 'bg-transparent border-b-2 border-white' : 'bg-transparent border-b border-white/10'} px-3 sm:px-4 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" aria-label="Status: Online" />
          <div className="min-w-0 flex-1">
            <h3 className={`font-medium ${highContrast ? 'text-white' : 'text-gray-100'} text-sm leading-tight`}>{demoConfig?.headerTitle || 'Support'}</h3>
            <p className={`text-xs ${highContrast ? 'text-gray-200' : 'text-gray-400'} leading-tight`}>Online - We typically reply instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`w-8 h-8 flex items-center justify-center rounded-full ${highContrast ? 'text-white hover:bg-white hover:text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50`}
            aria-label={`Toggle high contrast mode. Currently ${highContrast ? 'on' : 'off'}`}
            title="Toggle high contrast"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={`w-8 h-8 flex items-center justify-center rounded-full ${highContrast ? 'text-white hover:bg-white hover:text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50`}
            aria-label="Close chat widget"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 min-h-0 px-2 sm:px-3 py-3 bg-transparent overflow-y-auto overflow-x-hidden overscroll-contain`} 
        role="log" 
        aria-live="polite" 
        aria-label="Chat messages">
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


      {/* Input */}
      <div className={`px-3 sm:px-4 py-3 ${highContrast ? 'bg-transparent border-t-2 border-white' : 'bg-transparent border-t border-white/10'}`}>
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
              highContrast 
                ? 'bg-black border-2 border-white text-white placeholder:text-gray-300 focus:border-yellow-400 rounded-2xl' 
                : 'bg-[#262626] border-0 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-white/20 rounded-2xl'
            } focus:outline-none transition-all duration-200 leading-normal`}
          />
          <button
            onClick={() => {
              const sizes: Array<'normal' | 'large' | 'xlarge'> = ['normal', 'large', 'xlarge'];
              const currentIndex = sizes.indexOf(fontSize);
              setFontSize(sizes[(currentIndex + 1) % sizes.length] || 'normal');
            }}
            className={`h-10 w-10 flex items-center justify-center rounded-full flex-shrink-0 ${highContrast ? 'text-white hover:bg-white hover:text-black border border-white' : 'text-gray-400 hover:text-white hover:bg-white/10'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50`}
            aria-label={`Change text size. Current: ${fontSize}`}
            title="Change text size"
          >
            <Type className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={sendMessage}
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
    </div>
  );
}
