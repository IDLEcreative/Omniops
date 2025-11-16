# Shopping Feed Integration - Quick Start

**⚡ 5-Minute Setup Guide**

---

## What You Get

Transform product search results into Instagram Stories-style browsing:

```
User: "Show me winter jackets"
  ↓
AI: "I found 5 great jackets!"
  + [Browse 5 Products] button
  ↓
Click button → Full-screen shopping feed
  ↓
Swipe through products, tap to expand, double-tap to add to cart
```

---

## Step 1: Import Transformer (AI Processor)

```typescript
// lib/chat/ai-processor.ts
import {
  transformWooCommerceProducts,
  shouldTriggerShoppingMode,
  createShoppingMetadata,
  extractShoppingContext
} from '@/lib/chat/shopping-message-transformer';
```

---

## Step 2: Transform Products After Tool Execution

```typescript
// After AI calls searchProducts tool
const products = await searchProducts(query);
const shoppingProducts = transformWooCommerceProducts(products);

// Store for metadata
toolResults.shoppingProducts = shoppingProducts;
```

---

## Step 3: Add Shopping Metadata to Message

```typescript
// After AI completes response
if (shouldTriggerShoppingMode(finalResponse, toolResults.shoppingProducts)) {
  const shoppingMetadata = createShoppingMetadata(
    toolResults.shoppingProducts,
    extractShoppingContext(finalResponse, userQuery)
  );

  // Save message with shopping metadata
  await supabase.from('messages').insert({
    conversation_id,
    role: 'assistant',
    content: finalResponse,
    metadata: {
      sources: toolResults.sources,
      ...shoppingMetadata  // <-- Add this
    }
  });
}
```

---

## That's It!

The frontend automatically:
- ✅ Detects shopping products in message metadata
- ✅ Renders "Browse N Products" button
- ✅ Opens ShoppingFeed when clicked
- ✅ Handles all shopping UI interactions

---

## Example Message Structure

```json
{
  "role": "assistant",
  "content": "I found 5 winter jackets for you!",
  "metadata": {
    "shoppingProducts": [
      {
        "id": "101",
        "name": "Winter Parka",
        "price": 99.99,
        "salePrice": 79.99,
        "image": "https://...",
        "permalink": "winter-parka",
        "stockStatus": "instock"
      }
      // ... more products
    ],
    "shoppingContext": "Winter jacket search results"
  }
}
```

---

## Testing

```bash
# 1. Start dev server
npm run dev

# 2. Open chat widget
http://localhost:3000/widget-test

# 3. Send message
"Show me products"

# 4. Verify
- AI response appears
- "Browse N Products" button shows
- Click button → Shopping feed opens
- Swipe through products
```

---

## Troubleshooting

**Button not showing?**
- Check `message.metadata.shoppingProducts` exists
- Verify array has length > 0

**Shopping feed not opening?**
- Check browser console for errors
- Verify ShoppingFeed component imported

**Products have broken images?**
- Verify WooCommerce image URLs are absolute
- Check CORS headers

---

## Next Steps

- 📖 [Full Integration Guide](./GUIDE_SHOPPING_FEED_INTEGRATION.md)
- 📊 [Implementation Report](../10-ANALYSIS/ANALYSIS_SHOPPING_FEED_TYPE_INTEGRATION.md)
- 🛠️ [Shopping Types](../../types/shopping.ts)
