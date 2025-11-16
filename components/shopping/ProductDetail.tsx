'use client';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ShoppingProduct } from '@/types/shopping';
import Image from 'next/image';
import { useState, useCallback } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import {
  productDetailVariants,
  backdropVariants,
  variantChipVariants,
  galleryScrollVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from './transitions';
import {
  hapticMedium,
  hapticLight,
  hapticSuccess,
  hapticError,
} from '@/lib/haptics';

interface ProductDetailProps {
  product: ShoppingProduct;
  isExpanded: boolean;
  onCollapse: () => void;
  onAddToCart: (
    productId: string,
    quantity: number,
    variants?: Record<string, string>
  ) => void;
}

export function ProductDetail({
  product,
  isExpanded,
  onCollapse,
  onAddToCart,
}: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image];

  const isOnSale = product.salePrice && product.salePrice < product.price;
  const displayPrice = isOnSale ? product.salePrice : product.price;
  const isOutOfStock = product.stockStatus === 'outofstock';

  const handleVariantSelect = (variantName: string, option: string) => {
    hapticLight();
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: option,
    }));
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      hapticError();
      return;
    }

    setIsAddingToCart(true);
    hapticSuccess();

    onAddToCart(product.id, quantity, selectedVariants);

    // Simulate async operation
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 600);
  };

  /**
   * Handle swipe down to close
   */
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        hapticMedium();
        onCollapse();
      }
    },
    [onCollapse]
  );

  const handleQuantityChange = useCallback((delta: number) => {
    hapticLight();
    setQuantity((prev) => Math.max(1, prev + delta));
  }, []);

  return (
    <AnimatePresence>
      {isExpanded && (
        <>
          {/* Backdrop with Blur */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onCollapse}
            style={{ backdropFilter: 'blur(8px)' }}
          />

          {/* Detail Panel - Slide up with drag to close */}
          <motion.div
            variants={productDetailVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 top-20 bg-white rounded-t-3xl z-50 overflow-hidden flex flex-col"
          >
            {/* Drag Handle */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full" />

            {/* Close Button */}
            <motion.button
              onClick={onCollapse}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-lg"
              aria-label="Close product details"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Image Gallery */}
              <div className="relative w-full aspect-square bg-gray-100">
                <Image
                  src={images[selectedImage] || product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                />
              </div>

              {/* Thumbnail Gallery (horizontal scroll with snap) */}
              {images.length > 1 && (
                <motion.div
                  className="flex gap-2 px-4 py-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {images.map((img, idx) => (
                    <motion.button
                      key={idx}
                      variants={staggerItemVariants}
                      whileHover="hover"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        hapticLight();
                        setSelectedImage(idx);
                      }}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden snap-start border-2 transition-all ${
                        selectedImage === idx ? 'border-black scale-105' : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} view ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Product Info */}
              <div className="px-6 py-4 space-y-4">
                {/* Name */}
                <h2 className="text-2xl font-semibold leading-tight">{product.name}</h2>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    ${displayPrice?.toFixed(2)}
                  </span>
                  {isOnSale && (
                    <span className="text-lg text-gray-500 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                {isOutOfStock ? (
                  <div className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    Out of Stock
                  </div>
                ) : product.stockStatus === 'onbackorder' ? (
                  <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    On Backorder
                  </div>
                ) : (
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    In Stock
                  </div>
                )}

                {/* Description */}
                {product.shortDescription && (
                  <p className="text-gray-600 leading-relaxed">
                    {product.shortDescription}
                  </p>
                )}

                {/* Variants with Ripple Effect */}
                {product.variants && product.variants.map(variant => (
                  <div key={variant.id} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {variant.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map(option => (
                        <motion.button
                          key={option}
                          variants={variantChipVariants}
                          animate={selectedVariants[variant.name] === option ? 'selected' : 'unselected'}
                          whileTap="tap"
                          onClick={() => handleVariantSelect(variant.name, option)}
                          className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                            selectedVariants[variant.name] === option
                              ? 'border-black bg-black text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {option}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Quantity Selector with Haptic Feedback */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <div className="flex items-center gap-4">
                    <motion.button
                      onClick={() => handleQuantityChange(-1)}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <motion.span
                      key={quantity}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-xl font-semibold w-12 text-center"
                    >
                      {quantity}
                    </motion.span>
                    <motion.button
                      onClick={() => handleQuantityChange(1)}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add to Cart Button (Fixed at bottom) */}
            <div className="p-6 bg-white border-t border-gray-200">
              <motion.button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
                whileTap={{ scale: isOutOfStock ? 1 : 0.98 }}
                className={`w-full py-4 rounded-full font-semibold text-lg transition-all ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : isAddingToCart
                    ? 'bg-green-600 text-white'
                    : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                {isOutOfStock
                  ? 'Out of Stock'
                  : isAddingToCart
                  ? '✓ Added to Cart'
                  : 'Add to Cart'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
