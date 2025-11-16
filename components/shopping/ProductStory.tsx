'use client';

import { motion } from 'framer-motion';
import { ShoppingProduct } from '@/types/shopping';
import Image from 'next/image';
import { useState } from 'react';
import {
  productCardVariants,
  progressBarVariants,
  textSlideUpVariants,
  imageFadeVariants,
  saleBadgeVariants,
  pricePulseVariants,
  doubleTapScaleVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from './transitions';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';

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
  const [animatePrice, setAnimatePrice] = useState(false);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap - add to cart
      handleDoubleTap();
    } else {
      // Single tap - expand details
      hapticMedium();
      onExpand();
    }

    setLastTap(now);
  };

  const handleDoubleTap = () => {
    // Haptic feedback for add to cart
    hapticSuccess();

    // Trigger price pulse animation
    setAnimatePrice(true);
    setTimeout(() => setAnimatePrice(false), 500);

    onAddToCart(product.id);
  };

  const isOnSale = product.salePrice && product.salePrice < product.price;
  const displayPrice = isOnSale ? product.salePrice : product.price;
  const isOutOfStock = product.stockStatus === 'outofstock';

  return (
    <motion.div
      className="relative h-full w-full flex-shrink-0 snap-start snap-always"
      custom={index}
      variants={productCardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={handleTap}
    >
      {/* Hero Image with Fade */}
      <motion.div
        className="absolute inset-0"
        variants={imageFadeVariants}
        initial="hidden"
        animate="visible"
      >
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
      </motion.div>

      {/* Progress Indicators with Stagger */}
      <motion.div
        className="absolute top-4 left-0 right-0 flex gap-1 px-4"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden"
            variants={staggerItemVariants}
          >
            {i === index && (
              <motion.div
                className="h-full bg-white"
                variants={progressBarVariants}
                initial="empty"
                animate="filling"
              />
            )}
            {i < index && <div className="h-full bg-white" />}
          </motion.div>
        ))}
      </motion.div>

      {/* Product Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <motion.div
          variants={textSlideUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.2}
        >
          {/* Product Name */}
          <motion.h2
            className="text-2xl font-semibold mb-2 leading-tight"
            variants={textSlideUpVariants}
            custom={0.3}
          >
            {product.name}
          </motion.h2>

          {/* Price with Pulse on Add to Cart */}
          <motion.div
            className="flex items-baseline gap-2 mb-4"
            variants={pricePulseVariants}
            animate={animatePrice ? 'pulse' : 'normal'}
          >
            <span className="text-3xl font-bold">
              ${displayPrice?.toFixed(2)}
            </span>
            {isOnSale && (
              <span className="text-lg text-white/60 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </motion.div>

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

      {/* Sale Badge with Bounce */}
      {isOnSale && (
        <motion.div
          className="absolute top-16 right-4 px-3 py-1 bg-red-500 rounded-full text-white text-sm font-semibold shadow-lg"
          variants={saleBadgeVariants}
          initial="hidden"
          animate="visible"
        >
          Sale
        </motion.div>
      )}
    </motion.div>
  );
}
