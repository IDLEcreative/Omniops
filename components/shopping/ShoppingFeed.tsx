'use client';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ShoppingProduct, CartItem } from '@/types/shopping';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ProductStory } from './ProductStory';
import { ProductDetail } from './ProductDetail';
import { CartIndicator } from './CartIndicator';
import { X } from 'lucide-react';
import { chatToShoppingVariants } from './transitions';
import {
  hapticMedium,
  hapticLight,
  hapticProductChange,
  hapticSwipe,
} from '@/lib/haptics';
import { useRecommendations } from '@/hooks/useRecommendations';

interface ShoppingFeedProps {
  products: ShoppingProduct[];
  onExit: () => void;
  onProductView?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  sessionId?: string;
  conversationId?: string;
  storeDomain?: string | null;
}

export function ShoppingFeed({
  products,
  onExit,
  onProductView,
  onAddToCart,
  sessionId,
  conversationId,
  storeDomain,
}: ShoppingFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [domainId, setDomainId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch domainId from storeDomain
  useEffect(() => {
    if (!storeDomain) return;

    const fetchDomainId = async () => {
      try {
        const response = await fetch(`/api/widget/config?domain=${encodeURIComponent(storeDomain)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config?.id) {
            setDomainId(data.config.id);
          }
        }
      } catch (error) {
        console.error('[ShoppingFeed] Failed to fetch domainId:', error);
      }
    };

    fetchDomainId();
  }, [storeDomain]);

  // Initialize recommendations hook
  const {
    recommendations,
    loading: loadingRecs,
    error: recError,
    trackClick,
    trackPurchase,
  } = useRecommendations({
    domainId: domainId || '',
    sessionId,
    conversationId,
    limit: 10,
    algorithm: 'hybrid',
    excludeProductIds: products.map(p => p.id),
  });

  // Track current product view
  useEffect(() => {
    if (products[currentIndex]) {
      const productId = products[currentIndex].id;

      // Track for analytics
      if (onProductView) {
        onProductView(productId);
      }

      // Track for recommendations
      if (domainId) {
        trackClick(productId).catch(err =>
          console.warn('[ShoppingFeed] Failed to track product view:', err)
        );
      }
    }
  }, [currentIndex, onProductView, products, domainId, trackClick]);

  // Preload next 2 images
  useEffect(() => {
    const preloadImages = () => {
      const nextIndexes = [currentIndex + 1, currentIndex + 2];
      nextIndexes.forEach(idx => {
        if (idx < products.length && products[idx]) {
          const img = new Image();
          img.src = products[idx].image;
        }
      });
    };
    preloadImages();
  }, [currentIndex, products]);

  // Handle scroll snap with haptic feedback
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < products.length) {
        setCurrentIndex(newIndex);
        hapticProductChange();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex, products.length]);

  // Enhanced swipe gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchEndX.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    const SWIPE_THRESHOLD = 100;

    if (swipeDistance > SWIPE_THRESHOLD) {
      // Swipe right to exit
      const velocity = Math.abs(swipeDistance) / 100;
      hapticSwipe(velocity);
      handleExit();
    } else if (Math.abs(swipeDistance) > 20) {
      // Small swipe - light haptic feedback
      hapticLight();
    }
  }, [handleExit]);

  const handleExit = useCallback(() => {
    hapticMedium();
    onExit();
  }, [onExit]);

  const handleProductExpand = (productId: string) => {
    setExpandedProductId(productId);
  };

  const handleProductCollapse = () => {
    setExpandedProductId(null);
  };

  const handleAddToCartFromStory = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    addToCart(productId, 1);

    if (onAddToCart) {
      onAddToCart(productId);
    }
  };

  const handleAddToCartFromDetail = (
    productId: string,
    quantity: number,
    variants?: Record<string, string>
  ) => {
    addToCart(productId, quantity, variants);

    if (onAddToCart) {
      onAddToCart(productId);
    }

    // Close detail view after adding
    setExpandedProductId(null);
  };

  const addToCart = (
    productId: string,
    quantity: number,
    variants?: Record<string, string>
  ) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Track purchase for recommendations
    if (domainId) {
      trackPurchase(productId).catch(err =>
        console.warn('[ShoppingFeed] Failed to track purchase:', err)
      );
    }

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.productId === productId &&
          JSON.stringify(item.selectedVariants) === JSON.stringify(variants)
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const newCart = [...prevCart];
        const existingItem = newCart[existingItemIndex];
        if (existingItem) {
          newCart[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + quantity,
          };
        }
        return newCart;
      } else {
        // Add new item
        return [
          ...prevCart,
          {
            productId,
            name: product.name,
            price: product.salePrice || product.price,
            quantity,
            image: product.image,
            selectedVariants: variants,
          },
        ];
      }
    });
  };

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const expandedProduct = products.find(p => p.id === expandedProductId);

  return (
    <AnimatePresence>
      <motion.div
        variants={chatToShoppingVariants}
        initial="shoppingEnter"
        animate="shoppingEnter"
        exit="shoppingExit"
        className="fixed inset-0 bg-black z-50"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close Button with Animation */}
        <motion.button
          onClick={handleExit}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 20 }}
          className="absolute top-4 left-4 z-40 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full text-white backdrop-blur-sm"
          aria-label="Exit shopping feed"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Vertical Scroll Container */}
        <div
          ref={scrollRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className="h-full w-full"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ProductStory
                product={product}
                index={index}
                total={products.length}
                onExpand={() => handleProductExpand(product.id)}
                onAddToCart={handleAddToCartFromStory}
              />
            </div>
          ))}
        </div>

        {/* Cart Indicator */}
        <CartIndicator
          itemCount={totalItemCount}
          onClick={() => {
            // TODO: Implement cart view
            console.log('Cart clicked', cart);
          }}
        />

        {/* Product Detail Overlay */}
        {expandedProduct && (
          <ProductDetail
            product={expandedProduct}
            isExpanded={expandedProductId === expandedProduct.id}
            onCollapse={handleProductCollapse}
            onAddToCart={handleAddToCartFromDetail}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
