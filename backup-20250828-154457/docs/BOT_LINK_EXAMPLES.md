# Bot Link Providing Examples

## How It Works

When the bot finds relevant content from your website, it will now include direct links in its responses.

### Example 1: Product Inquiry
**User**: "Do you have wireless headphones?"

**Bot**: "Yes, we have several wireless headphone models available! You can view our full selection on our [headphones page](https://example.com/products/headphones). We offer noise-cancelling, sports, and premium audiophile options starting from $79."

### Example 2: Shipping Information
**User**: "What are your shipping rates?"

**Bot**: "We offer free shipping on orders over $50! For orders under $50, shipping is $5.99. You can find detailed information about delivery times and international shipping on our [shipping policy page](https://example.com/shipping)."

### Example 3: Multiple Links
**User**: "I need to return an item I bought last week"

**Bot**: "I'd be happy to help with your return. Our return policy allows returns within 30 days of purchase. Please visit our [returns page](https://example.com/returns) to start the process. You'll need your order number and can fill out the [return form](https://example.com/returns/form) online."

### Example 4: Contact Information
**User**: "How can I contact customer service?"

**Bot**: "You can reach our customer service team through several channels:
- Email: support@example.com
- Phone: 1-800-EXAMPLE (Monday-Friday, 9am-5pm EST)
- Or visit our [contact page](https://example.com/contact) for more options including live chat and our physical store locations."

## Link Formats Supported

The bot can provide links in several formats:

1. **Inline Markdown Links**: `[link text](url)`
   - Renders as: [link text](url)
   
2. **Plain URLs**: `https://example.com/page`
   - Automatically converted to clickable links

3. **Natural Language with URLs**: "Visit our website at example.com/products"
   - The URL is automatically detected and made clickable

## Implementation Details

### What Changed:

1. **System Prompt Enhancement**: The AI is now instructed to include relevant page URLs when answering questions.

2. **MessageContent Component**: A new component that:
   - Detects URLs in bot responses
   - Converts them to clickable links
   - Opens links in new tabs for security
   - Supports both markdown and plain URL formats

3. **Source Tracking**: The bot knows which pages contain relevant information and can reference them naturally.

## Benefits for Users

- **Direct Navigation**: Users can jump straight to the page they need
- **Self-Service**: Users can explore more details on their own
- **Trust Building**: Providing sources increases credibility
- **Reduced Back-and-Forth**: Users get comprehensive information immediately

## Testing the Feature

To test if links are working:

1. Ask about specific products or services
2. Request policy information (shipping, returns, etc.)
3. Ask "where can I find..." questions
4. The bot should naturally include relevant links in its responses

All links will:
- Open in new tabs (target="_blank")
- Have proper security attributes (rel="noopener noreferrer")
- Be styled with your theme's primary color
- Show hover effects for better UX