'use client';

import { motion } from 'framer-motion';
import { ShoppingProduct } from '@/types/shopping';
import Image from 'next/image';
import { useState } from 'react';

interface ProductStoryProps {
  product: ShoppingProduct;
  index: number;
  total: number;
  onExpand: () => void;
  onAddToCart: (productId: string) => void;
}

export function ProductStory({
  product,
  index,
  total,
  onExpand,
  onAddToCart,
}: ProductStoryProps) {
  const [lastTap, setLastTap] = useState(0);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap - add to cart
      handleDoubleTap();
    } else {
      // Single tap - expand details
      onExpand();
    }

    setLastTap(now);
  };

  const handleDoubleTap = () => {
    // Haptic feedback (works on mobile)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    onAddToCart(product.id);
  };

  const isOnSale = product.salePrice && product.salePrice < product.price;
  const displayPrice = isOnSale ? product.salePrice : product.price;
  const isOutOfStock = product.stockStatus === 'outofstock';

  return (
    <motion.div
      className="relative h-full w-full flex-shrink-0 snap-start snap-always"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleTap}
    >
      {/* Hero Image */}
      <div className="absolute inset-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          priority={index === 0}
          sizes="100vw"
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Progress Indicators */}
      <div className="absolute top-4 left-0 right-0 flex gap-1 px-4">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden"
          >
            {i === index && (
              <motion.div
                className="h-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'linear' }}
              />
            )}
            {i < index && <div className="h-full bg-white" />}
          </div>
        ))}
      </div>

      {/* Product Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Product Name */}
          <h2 className="text-2xl font-semibold mb-2 leading-tight">
            {product.name}
          </h2>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold">
              ${displayPrice?.toFixed(2)}
            </span>
            {isOnSale && (
              <span className="text-lg text-white/60 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {isOutOfStock && (
            <div className="inline-block px-3 py-1 bg-red-500/80 rounded-full text-sm font-medium mb-4">
              Out of Stock
            </div>
          )}

          {/* Subtle hint text */}
          <p className="text-sm text-white/70">
            Tap to view details • Double-tap to add to cart
          </p>
        </motion.div>
      </div>

      {/* Sale Badge */}
      {isOnSale && (
        <div className="absolute top-16 right-4 px-3 py-1 bg-red-500 rounded-full text-white text-sm font-semibold">
          Sale
        </div>
      )}
    </motion.div>
  );
}
