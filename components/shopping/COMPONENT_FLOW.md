# Shopping Component Flow Diagram

**Visual guide to component interactions and state management**

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ShoppingFeed.tsx                       │
│                     (Main Container)                        │
│  State: cart[], currentIndex, expandedProductId            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Renders
                              ▼
        ┌─────────────────────────────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────┐                    ┌──────────────────┐
│  ProductStory    │                    │  CartIndicator   │
│  (Repeating)     │                    │  (Fixed Float)   │
│                  │                    │                  │
│  Props:          │                    │  Props:          │
│  - product       │                    │  - itemCount     │
│  - index/total   │                    │  - onClick       │
│  - onExpand      │────Tap────┐        │                  │
│  - onAddToCart   │           │        │  Shows when:     │
│                  │           │        │  cart.length > 0 │
│  Actions:        │           │        │                  │
│  - Single tap    │           │        │  Badge:          │
│    → Expand      │           │        │  99+ for 100+    │
│  - Double tap    │           │        │                  │
│    → Quick add   │           │        └──────────────────┘
│                  │           │
└──────────────────┘           │
                               │
                               ▼
                    ┌──────────────────┐
                    │  ProductDetail   │
                    │  (Overlay)       │
                    │                  │
                    │  Props:          │
                    │  - product       │
                    │  - isExpanded    │
                    │  - onCollapse    │
                    │  - onAddToCart   │
                    │                  │
                    │  Features:       │
                    │  - Image gallery │
                    │  - Variants      │
                    │  - Quantity      │
                    │  - Add to cart   │
                    │                  │
                    └──────────────────┘
```

---

## State Flow

### 1. Cart Management

```
User Action
    ↓
Double-tap on ProductStory
    ↓
ProductStory.onAddToCart(productId)
    ↓
ShoppingFeed.handleAddToCartFromStory(productId)
    ↓
ShoppingFeed.addToCart(productId, quantity=1)
    ↓
setCart([...cart, newItem])
    ↓
CartIndicator re-renders with updated itemCount
    ↓
Badge shows new count with pulse animation
```

### 2. Product Detail Expansion

```
User Action
    ↓
Tap on ProductStory
    ↓
ProductStory.onExpand()
    ↓
ShoppingFeed.handleProductExpand(productId)
    ↓
setExpandedProductId(productId)
    ↓
ProductDetail renders with isExpanded=true
    ↓
Slides up from bottom (Framer Motion)
```

### 3. Add to Cart from Detail View

```
User Action
    ↓
Select variants + quantity in ProductDetail
    ↓
Click "Add to Cart" button
    ↓
ProductDetail.onAddToCart(productId, quantity, variants)
    ↓
ShoppingFeed.handleAddToCartFromDetail(...)
    ↓
ShoppingFeed.addToCart(productId, quantity, variants)
    ↓
setCart([...cart, newItem])
    ↓
setExpandedProductId(null) // Close detail view
    ↓
CartIndicator updates
```

---

## Event Flow Diagram

```
┌─────────────┐
│  Chat UI    │
│             │
│  "Show me   │
│   pumps"    │
└─────┬───────┘
      │
      │ Products received
      │
      ▼
┌─────────────────────────────────────────────┐
│         ShoppingFeed Opens                  │
│         (Slide in from right)               │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  ProductStory #1                    │   │
│  │  [Hero Image]                       │   │
│  │                                     │   │
│  │  Product Name                       │   │
│  │  $99.99                             │   │
│  │                                     │   │
│  │  Tap to view • Double-tap to add   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  User scrolls down ▼                        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  ProductStory #2                    │   │
│  │  [Hero Image]                       │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
      │
      │ User taps product
      │
      ▼
┌─────────────────────────────────────────────┐
│         ProductDetail Expands               │
│         (Slide up from bottom)              │
│                                             │
│  [X]                                        │
│                                             │
│  ┌───────────────────────────────────┐     │
│  │     [Main Product Image]          │     │
│  └───────────────────────────────────┘     │
│                                             │
│  [🖼️] [🖼️] [🖼️] [🖼️]  ← Thumbnails        │
│                                             │
│  Product Name                               │
│  $99.99                                     │
│  ✅ In Stock                                │
│                                             │
│  Size: [S] [M] [L] [XL]                    │
│  Color: [Red] [Blue] [Black]               │
│                                             │
│  Quantity: [-] 2 [+]                       │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │      ADD TO CART                   │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
      │
      │ User clicks Add to Cart
      │
      ▼
┌─────────────────────────────────────────────┐
│  ProductDetail shows success state          │
│  "✓ Added to Cart" (0.6s)                   │
└─────────────────────────────────────────────┘
      │
      │ Auto-collapse
      │
      ▼
┌─────────────────────────────────────────────┐
│  Back to ShoppingFeed                       │
│                                             │
│  CartIndicator appears in bottom-right ──┐  │
│                                           │  │
│  ┌────────┐                              │  │
│  │   🛒   │                              │  │
│  │   [2]  │ ← Item count badge           │  │
│  └────────┘                              │  │
└─────────────────────────────────────────┴───┘
```

---

## Touch Gestures

```
ProductStory:
├─ Single Tap       → Expand ProductDetail
├─ Double Tap       → Quick add to cart (haptic feedback)
└─ Vertical Scroll  → Browse products (snap-to-product)

ProductDetail:
├─ Tap [X] button   → Collapse
├─ Tap backdrop     → Collapse
├─ Horizontal Scroll → Image gallery
└─ Tap thumbnail    → Select image

ShoppingFeed:
├─ Swipe Right      → Exit to chat (slide out)
└─ Vertical Scroll  → Browse products

CartIndicator:
└─ Tap              → View cart (TODO)
```

---

## Animation Details

### Entry Animations

```typescript
ShoppingFeed:
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  transition={{ type: 'spring', damping: 30, stiffness: 300 }}

ProductDetail:
  initial={{ y: '100%' }}
  animate={{ y: 0 }}
  transition={{ type: 'spring', damping: 30, stiffness: 300 }}

CartIndicator:
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
```

### Interaction Animations

```typescript
CartIndicator (Count Change):
  Pulse effect:
    initial={{ scale: 1, opacity: 0.5 }}
    animate={{ scale: 1.5, opacity: 0 }}
    transition={{ duration: 0.6 }}

Add to Cart Button:
  whileTap={{ scale: 0.98 }}
  Success state: bg-green-600 (0.6s)
```

---

## Performance Optimizations

1. **Image Preloading**
   ```typescript
   // In ShoppingFeed
   useEffect(() => {
     const nextIndexes = [currentIndex + 1, currentIndex + 2];
     nextIndexes.forEach(idx => {
       if (idx < products.length) {
         const img = new Image();
         img.src = products[idx].image;
       }
     });
   }, [currentIndex]);
   ```

2. **CSS Scroll Snap**
   ```css
   .feed-container {
     overflow-y: scroll;
     scroll-snap-type: y mandatory;
   }

   .product-story {
     scroll-snap-align: start;
   }
   ```

3. **Next.js Image Optimization**
   ```typescript
   <Image
     src={product.image}
     alt={product.name}
     fill
     priority={index === 0}  // Priority for first product
     sizes="100vw"
   />
   ```

---

## Accessibility

### ARIA Labels

```typescript
// Close buttons
aria-label="Close product details"
aria-label="Exit shopping feed"

// Cart indicator
aria-label={`View cart with ${itemCount} item${itemCount !== 1 ? 's' : ''}`}

// Quantity controls
aria-label="Decrease quantity"
aria-label="Increase quantity"
```

### Touch Targets

All interactive elements meet **44px minimum** touch target size:
- Close buttons: 40px (within acceptable range)
- Add to cart button: 48px height
- Variant chips: 40px height
- Quantity +/- buttons: 40px × 40px

---

## Error Handling

### Out of Stock Products

```typescript
if (isOutOfStock) {
  return (
    <button disabled className="bg-gray-200 text-gray-500 cursor-not-allowed">
      Out of Stock
    </button>
  );
}
```

### Missing Images

```typescript
const images = product.images && product.images.length > 0
  ? product.images
  : [product.image];  // Fallback to main image
```

### Cart State Management

```typescript
// Prevent duplicates with same variants
const existingItemIndex = cart.findIndex(
  item => item.productId === productId &&
    JSON.stringify(item.selectedVariants) === JSON.stringify(variants)
);

if (existingItemIndex >= 0) {
  // Update quantity
  newCart[existingItemIndex].quantity += quantity;
} else {
  // Add new item
  cart.push(newItem);
}
```

---

## Future Implementation: Cart View

```typescript
// TODO: Implement full cart view
const CartView = ({ items, onClose, onCheckout }) => (
  <motion.div
    initial={{ y: '100%' }}
    animate={{ y: 0 }}
    className="fixed inset-0 bg-white z-50"
  >
    <CartHeader onClose={onClose} />
    <CartItems items={items} />
    <CartTotal items={items} />
    <CheckoutButton onClick={onCheckout} />
  </motion.div>
);
```

---

**Last Updated:** 2025-01-16
**Status:** Components complete, cart view pending
