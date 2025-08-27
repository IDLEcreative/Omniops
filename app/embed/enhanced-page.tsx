'use client';

import { useState, useEffect, useRef } from 'react';
import ChatWidget from '@/components/ChatWidget';
import { Message } from '@/types';

interface UserData {
  isLoggedIn: boolean;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  customerSince: string;
  totalOrders: number;
  totalSpent: string;
  lastOrderId: string;
  customerGroup: 'guest' | 'new' | 'regular' | 'vip';
}

interface CartData {
  hasItems: boolean;
  itemCount: number;
  cartTotal: string;
  cartCurrency: string;
  cartItems: Array<{
    id: string;
    name: string;
    quantity: number;
    price: string;
  }>;
}

interface PageContext {
  pageType: string;
  pageUrl: string;
  productId?: string;
  productName?: string;
  categoryId?: string;
  categoryName?: string;
}

export default function EnhancedEmbedPage() {
  const [demoId, setDemoId] = useState<string>('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [initialOpen, setInitialOpen] = useState(false);
  const [customGreeting, setCustomGreeting] = useState<string>('');
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // Parse URL parameters and listen for parent messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Get basic parameters
    const demo = params.get('demo');
    if (demo) setDemoId(demo);
    
    // Check for user data in URL params (basic info)
    if (params.get('userId')) {
      setUserData({
        isLoggedIn: true,
        userId: params.get('userId') || '',
        email: params.get('userEmail') || '',
        displayName: params.get('userName') || '',
        firstName: '',
        lastName: '',
        customerSince: '',
        totalOrders: 0,
        totalSpent: '0',
        lastOrderId: '',
        customerGroup: 'guest',
      });
    }

    // Set up message listener for detailed context from parent
    messageHandlerRef.current = (event: MessageEvent) => {
      // Security: Only accept messages from parent origin
      if (event.origin !== window.parent.location.origin && 
          !event.origin.includes('localhost') && 
          !event.origin.includes('127.0.0.1')) {
        return;
      }

      switch (event.data.type) {
        case 'init':
          // Receive full context from parent window
          if (event.data.userData) {
            setUserData(event.data.userData);
            generatePersonalizedGreeting(event.data.userData, event.data.pageContext);
          }
          if (event.data.cartData) {
            setCartData(event.data.cartData);
          }
          if (event.data.pageContext) {
            setPageContext(event.data.pageContext);
          }
          break;
          
        case 'updateContext':
          // Handle dynamic context updates (e.g., cart changes)
          if (event.data.userData) {
            setUserData(event.data.userData);
          }
          if (event.data.cartData) {
            setCartData(event.data.cartData);
            // Auto-open if cart was just abandoned
            if (event.data.cartData.hasItems && event.data.cartData.itemCount > 0) {
              checkForAbandonedCart(event.data.cartData);
            }
          }
          if (event.data.pageContext) {
            setPageContext(event.data.pageContext);
          }
          break;
          
        case 'open':
          setInitialOpen(true);
          break;
          
        case 'close':
          setInitialOpen(false);
          break;
      }
    };

    window.addEventListener('message', messageHandlerRef.current);
    
    return () => {
      if (messageHandlerRef.current) {
        window.removeEventListener('message', messageHandlerRef.current);
      }
    };
  }, []);

  // Generate personalized greeting based on user context
  const generatePersonalizedGreeting = (user: UserData, context: PageContext | null) => {
    if (!user.isLoggedIn) {
      // Guest greetings based on page context
      if (context?.pageType === 'product') {
        setCustomGreeting(`Questions about ${context.productName || 'this product'}? I'm here to help!`);
      } else if (context?.pageType === 'checkout') {
        setCustomGreeting("Need help completing your order? I'm here to assist!");
      } else {
        setCustomGreeting("Hello! How can I help you today?");
      }
      return;
    }

    // Logged-in user greetings
    const name = user.firstName || user.displayName || 'there';
    
    if (user.customerGroup === 'vip') {
      setCustomGreeting(`Welcome back, ${name}! As a VIP customer, you have priority support. How can I assist you today?`);
    } else if (user.totalOrders > 5) {
      setCustomGreeting(`Hi ${name}! Great to see you again. What can I help you with today?`);
    } else if (user.totalOrders > 0) {
      setCustomGreeting(`Welcome back, ${name}! How can I help you today?`);
    } else {
      setCustomGreeting(`Hello ${name}! Welcome to our store. I'm here to help with any questions!`);
    }
  };

  // Check for abandoned cart and offer help
  const checkForAbandonedCart = (cart: CartData) => {
    // If cart has items and user hasn't interacted for 5 minutes
    const lastActivity = localStorage.getItem('chat_last_activity');
    const now = Date.now();
    
    if (lastActivity) {
      const timeSinceActivity = now - parseInt(lastActivity);
      if (timeSinceActivity > 5 * 60 * 1000 && cart.itemCount > 0) {
        setCustomGreeting("I noticed you have items in your cart. Need any help completing your purchase?");
        setInitialOpen(true);
      }
    }
    
    localStorage.setItem('chat_last_activity', now.toString());
  };

  // Build initial message context for the chat
  const buildInitialContext = () => {
    const contextParts: string[] = [];
    
    if (userData?.isLoggedIn) {
      contextParts.push(`User: ${userData.displayName} (${userData.email})`);
      contextParts.push(`Customer type: ${userData.customerGroup}`);
      if (userData.lastOrderId) {
        contextParts.push(`Last order: #${userData.lastOrderId}`);
      }
    }
    
    if (cartData?.hasItems) {
      contextParts.push(`Cart: ${cartData.itemCount} items (${cartData.cartCurrency} ${cartData.cartTotal})`);
    }
    
    if (pageContext?.pageType === 'product' && pageContext.productName) {
      contextParts.push(`Viewing: ${pageContext.productName}`);
    }
    
    return contextParts.join(' | ');
  };

  // Enhanced ChatWidget props with user context
  // Note: Only pass props that ChatWidget accepts
  const enhancedProps = {
    demoId,
    initialOpen,
    onMessage: (message: Message) => {
      // Track user activity
      localStorage.setItem('chat_last_activity', Date.now().toString());
    },
    // Store additional context in demo config
    demoConfig: {
      customGreeting,
      userContext: userData ? {
        isAuthenticated: userData.isLoggedIn,
        email: userData.email,
        name: userData.displayName,
        metadata: {
          customerId: userData.userId,
          customerGroup: userData.customerGroup,
          totalOrders: userData.totalOrders,
          totalSpent: userData.totalSpent,
          lastOrderId: userData.lastOrderId,
        }
      } : undefined,
      initialContext: buildInitialContext(),
      additionalContext: {
        cart: cartData,
        page: pageContext,
      }
    }
  };

  return (
    <div>
      <ChatWidget {...enhancedProps} />
      
      {/* Hidden debug panel - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: 10,
          left: 10,
          background: 'white',
          padding: 10,
          border: '1px solid #ccc',
          fontSize: 10,
          maxWidth: 200,
          zIndex: 10000,
          display: 'none', // Toggle to 'block' for debugging
        }}>
          <h4>Debug Context</h4>
          <pre>{JSON.stringify({ userData, cartData, pageContext }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}