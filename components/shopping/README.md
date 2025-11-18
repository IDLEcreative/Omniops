**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Shopping Components

**Purpose:** Next-level mobile shopping experience with Instagram Stories-style product browsing.

**Last Updated:** 2025-01-16

---

## Components

### 1. ShoppingFeed.tsx (Main Container)
**Lines:** 200 | **Status:** ✅ Complete

**Purpose:** Full-screen vertical scrolling product feed with cart management.

**Features:**
- Vertical scroll with CSS snap (scroll-snap-type: y mandatory)
- Progress tracking (current product index)
- Preload next 2 images for smooth scrolling
- Swipe right to exit (back to chat)
- Cart state management
- Product detail expansion overlay
- Touch gesture handling

**Usage:**
```tsx
import { ShoppingFeed } from '@/components/shopping/ShoppingFeed';

<ShoppingFeed
  products={shoppingProducts}
  onExit={() => setShowFeed(false)}
  onProductView={(id) => trackProductView(id)}
  onAddToCart={(id) => trackAddToCart(id)}
/>
```

**Key Interactions:**
- Vertical scroll to browse products (snap-to-product)
- Tap product → Expand detail view
- Double-tap product → Quick add to cart
- Swipe right → Exit feed
- Cart indicator shows in bottom-right corner

---

### 2. ProductStory.tsx (Product Card)
**Lines:** 142 | **Status:** ✅ Complete (Previously created)

**Purpose:** Full-screen product card with hero image and minimal UI chrome.

**Features:**
- Hero image with gradient overlay
- Progress indicators at top
- Product info overlay (name, price, stock status)
- Sale badge
- Double-tap to add to cart
- Single tap to expand details
- Haptic feedback

**Props:**
```tsx
interface ProductStoryProps {
  product: ShoppingProduct;
  index: number;
  total: number;
  onExpand: () => void;
  onAddToCart: (productId: string) => void;
}
```

---

### 3. ProductDetail.tsx (Detail View)
**Lines:** ~220 | **Status:** ✅ Complete

**Purpose:** Inline expansion panel for detailed product information.

**Features:**
- Slides up from bottom (spring animation)
- Horizontal scroll image gallery (CSS scroll snap)
- Thumbnail selector
- Variant selector chips (Size, Color, etc.)
- Quantity selector (+/- buttons)
- Stock status indicator
- Prominent "Add to Cart" button with loading state
- Close button + tap backdrop to collapse
- Smooth Framer Motion animations

**Props:**
```tsx
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
```

**Key Interactions:**
- Swipe through image gallery
- Select variants (radio chips)
- Adjust quantity
- Add to cart (with haptic feedback)
- Close via X button or backdrop tap

---

### 4. CartIndicator.tsx (Cart Badge)
**Lines:** ~65 | **Status:** ✅ Complete

**Purpose:** Minimal floating cart indicator with item count badge.

**Features:**
- Fixed position bottom-right corner
- Circular badge with shopping cart icon
- Item count overlay (shows 99+ for 100+)
- Pulse animation on count change
- Hidden when cart is empty
- Haptic feedback on tap
- Smooth fade in/out animations

**Props:**
```tsx
interface CartIndicatorProps {
  itemCount: number;
  onClick: () => void;
}
```

**Behavior:**
- Automatically shows when items added to cart
- Automatically hides when cart is empty
- Pulses on count change for visual feedback

---

## Component Hierarchy

```
ShoppingFeed (Container)
├── ProductStory × N (Vertical scroll)
│   └── [Tap to expand]
│
├── ProductDetail (Overlay)
│   ├── Image Gallery
│   ├── Variant Selectors
│   ├── Quantity Selector
│   └── Add to Cart Button
│
└── CartIndicator (Fixed position)
    └── [Tap to view cart]
```

---

## User Flow

```
Chat Message: "Show me pumps"
    ↓
ShoppingFeed opens (full-screen takeover)
    ↓
User scrolls vertically through products (snap-to-product)
    ↓
Tap product → ProductDetail expands
    ↓
Select variants, quantity, Add to Cart
    ↓
ProductDetail collapses, CartIndicator appears
    ↓
Swipe right to exit → Back to chat
```

---

## Design Principles

1. **90% Image, 10% UI Chrome**
   - Product images are the hero
   - UI elements are minimal and elegant
   - Generous whitespace

2. **Smooth, Delightful Animations**
   - Framer Motion for all transitions
   - Spring physics for natural feel
   - Haptic feedback on interactions

3. **Zero Friction**
   - Double-tap to quick add
   - Swipe to exit
   - Tap backdrop to close
   - No confirmation dialogs

4. **Mobile-First**
   - Touch targets 44px+ (accessibility)
   - CSS scroll snap for native feel
   - Optimized for thumb zone
   - Haptic feedback where supported

---

## Technical Details

### Dependencies
- `framer-motion` - Animations and gestures
- `lucide-react` - Icons (ShoppingCart, X, Plus, Minus)
- `next/image` - Image optimization
- `@/types/shopping` - TypeScript types

### CSS Features
- CSS Scroll Snap (`scroll-snap-type`, `scroll-snap-align`)
- Custom `scrollbar-hide` utility (added to Tailwind config)
- Backdrop blur for glassmorphism
- Gradient overlays for text readability

### Performance Optimizations
- Image preloading (next 2 products)
- Next.js Image component with priority loading
- CSS-based scrolling (hardware accelerated)
- Debounced scroll handlers

### Accessibility
- Proper ARIA labels on buttons
- Touch targets meet 44px minimum
- Keyboard navigation support (where applicable)
- Screen reader friendly

---

## Future Enhancements

**Planned:**
- [ ] Cart view (full cart details)
- [ ] Checkout integration
- [ ] Product favoriting/wishlist
- [ ] Share product functionality
- [ ] Product recommendations

**Possible:**
- [ ] AR product preview
- [ ] Video product showcases
- [ ] User reviews in detail view
- [ ] Related products carousel

---

## File Sizes

| File | Lines | Status |
|------|-------|--------|
| ShoppingFeed.tsx | 200 | ✅ Under 300 LOC |
| ProductDetail.tsx | 220 | ✅ Under 300 LOC |
| ProductStory.tsx | 142 | ✅ Under 300 LOC |
| CartIndicator.tsx | 65 | ✅ Under 300 LOC |

**Total:** ~627 lines across 4 components

---

## Testing

**Manual Testing Checklist:**
- [ ] Vertical scroll snaps to products
- [ ] Tap product expands detail view
- [ ] Double-tap adds to cart (haptic feedback)
- [ ] Image gallery scrolls horizontally
- [ ] Variant selection works
- [ ] Quantity selector increments/decrements
- [ ] Add to cart shows loading state
- [ ] Cart indicator appears when items added
- [ ] Cart indicator shows correct count
- [ ] Swipe right exits feed
- [ ] Backdrop tap closes detail view
- [ ] All animations are smooth

**Browser Testing:**
- [ ] Safari iOS (primary target)
- [ ] Chrome Android
- [ ] Mobile Safari (iPad)

---

## Related Documentation

- [Shopping Types](../../types/shopping.ts) - TypeScript type definitions
- [Tailwind Config](../../tailwind.config.js) - Custom utilities
- [CLAUDE.md](../../CLAUDE.md) - Brand-agnostic guidelines

---

**Maintained by:** UI Components Team
**Contact:** See CLAUDE.md for contribution guidelines
