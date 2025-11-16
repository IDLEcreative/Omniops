'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cartIndicatorVariants } from './transitions';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';

interface CartIndicatorProps {
  itemCount: number;
  onClick: () => void;
}

export function CartIndicator({ itemCount, onClick }: CartIndicatorProps) {
  const [shouldPulse, setShouldPulse] = useState(false);
  const [prevCount, setPrevCount] = useState(itemCount);

  // Pulse animation when count changes
  useEffect(() => {
    if (itemCount > prevCount) {
      setShouldPulse(true);
      hapticSuccess();
      setTimeout(() => setShouldPulse(false), 300);
    }
    setPrevCount(itemCount);
  }, [itemCount, prevCount]);

  if (itemCount === 0) {
    return null;
  }

  const handleClick = () => {
    hapticMedium();
    onClick();
  };

  return (
    <AnimatePresence>
      <motion.button
        variants={cartIndicatorVariants}
        initial="hidden"
        animate={shouldPulse ? 'pulse' : 'visible'}
        exit="exit"
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-4 right-4 z-50"
        onClick={handleClick}
        aria-label={`View cart with ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
      >
        {/* Main circular button */}
        <motion.div
          className="relative flex items-center justify-center w-14 h-14 bg-black rounded-full shadow-lg"
          animate={shouldPulse ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ShoppingCart className="w-6 h-6 text-white" strokeWidth={2} />

          {/* Badge with count - Bounce on change */}
          <motion.div
            key={itemCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 400 }}
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-red-500 rounded-full"
          >
            <span className="text-xs font-bold text-white">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          </motion.div>

          {/* Pulse ring animation on item added */}
          {shouldPulse && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-black rounded-full"
            />
          )}
        </motion.div>
      </motion.button>
    </AnimatePresence>
  );
}
