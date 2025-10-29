# Enabling Bot to Provide Links

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [Chat API Documentation](../03-API/)
- [Widget Configuration](../02-GUIDES/)
**Estimated Read Time:** 8 minutes

## Purpose
Implementation guide for enabling chatbot to include source URLs in responses using system prompt modification, enhanced source display components, and inline link processing. Improves user experience with clickable references to relevant website pages.

## Quick Links
- [Current Status](#current-status)
- [Quick Implementation Guide](#quick-implementation-guide)
- [Option 1: Modify System Prompt](#option-1-modify-system-prompt-easiest)
- [Option 2: Enhanced Source Display](#option-2-enhanced-source-display-better-ux)
- [Option 3: Inline Link Processing](#option-3-inline-link-processing)
- [Implementation Steps](#implementation-steps)
- [Advanced Features](#advanced-features)
- [Benefits](#benefits)

## Keywords
bot links, source URLs, chatbot references, system prompt, markdown links, ReactMarkdown, link integration, source display, link tracking, smart link suggestions, link analytics, clickable references, response enrichment

## Aliases
- "bot links" (also known as: source URLs, reference links, chatbot citations, content sources)
- "system prompt" (also known as: AI instructions, prompt engineering, chatbot configuration)
- "source display" (also known as: reference UI, source component, citation display)
- "link tracking" (also known as: click analytics, link metrics, engagement tracking)

---

## Current Status
The bot already tracks source URLs when finding relevant content, but doesn't currently include them in responses.

## Quick Implementation Guide

### Option 1: Modify System Prompt (Easiest)
Add this to the system prompt in `/app/api/chat/route.ts`:

```typescript
const systemMessage = `${context}

When answering questions, if you have relevant source URLs from the website content, please include them in your response in a natural way. For example:
- "You can find more details about shipping on our [shipping page](${sources[0]?.url})"
- "According to the [FAQ section](${sources[0]?.url}), ..."
- "Learn more at: ${sources[0]?.url}"

Available source pages:
${sources.map(s => `- ${s.title}: ${s.url}`).join('\n')}
`;
```

### Option 2: Enhanced Source Display (Better UX)
Create a sources component in the chat interface:

```typescript
// components/chat/SourceLinks.tsx
export function SourceLinks({ sources }: { sources: Array<{ url: string; title: string }> }) {
  if (!sources || sources.length === 0) return null;
  
  return (
    <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
      <p className="text-muted-foreground mb-1">Sources:</p>
      {sources.map((source, i) => (
        <a 
          key={i}
          href={source.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block text-primary hover:underline"
        >
          {source.title || source.url}
        </a>
      ))}
    </div>
  );
}
```

### Option 3: Inline Link Processing
Process the AI response to automatically convert references to clickable links:

```typescript
function enrichResponseWithLinks(response: string, sources: Source[]): string {
  let enrichedResponse = response;
  
  // Look for phrases like "shipping page", "contact page", etc.
  sources.forEach(source => {
    const pageType = extractPageType(source.title); // e.g., "shipping", "contact"
    const regex = new RegExp(`(${pageType}\\s*(?:page|section|information))`, 'gi');
    enrichedResponse = enrichedResponse.replace(regex, `[$1](${source.url})`);
  });
  
  return enrichedResponse;
}
```

## Implementation Steps

### Step 1: Update the Chat API
```typescript
// In /app/api/chat/route.ts, modify the system message:
const systemMessage = {
  role: 'system',
  content: `${context}
  
You are a helpful customer service assistant. When you have relevant website pages that answer the user's question, please mention them naturally in your response and include the page URL.

Available pages:
${sources.map(s => `- ${s.title}: ${s.url}`).join('\n')}

Always format links as markdown: [link text](url)`
};
```

### Step 2: Handle Markdown in Chat UI
```typescript
// Install react-markdown
npm install react-markdown

// In chat message display:
import ReactMarkdown from 'react-markdown';

<ReactMarkdown 
  components={{
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {children}
      </a>
    )
  }}
>
  {message.content}
</ReactMarkdown>
```

### Step 3: Test the Integration
1. Ask the bot about specific topics: "What are your shipping rates?"
2. Bot should respond with: "Our shipping rates can be found on our [shipping page](https://example.com/shipping)..."
3. Verify links are clickable and open in new tabs

## Advanced Features

### Smart Link Suggestions
The bot can suggest relevant pages even if not directly asked:

```typescript
// Add to system prompt:
"If the user's question might benefit from exploring related pages, suggest them at the end of your response like: 'You might also find our [return policy](url) and [FAQ](url) helpful.'"
```

### Link Analytics
Track which links users click:

```typescript
// Add click tracking
const trackLinkClick = async (url: string, conversationId: string) => {
  await fetch('/api/analytics/link-click', {
    method: 'POST',
    body: JSON.stringify({ url, conversationId })
  });
};
```

## Benefits
1. **Better User Experience**: Users can navigate directly to relevant pages
2. **Increased Engagement**: Users explore more of the website
3. **Trust Building**: Providing sources increases credibility
4. **Reduced Follow-up Questions**: Users can self-serve for more details

## Example Responses With Links

**Without links:**
"We offer free shipping on orders over $50."

**With links:**
"We offer free shipping on orders over $50. You can view our complete [shipping policy](https://example.com/shipping) for more details about delivery times and international shipping options."

**Multiple sources:**
"Yes, we accept returns within 30 days. Please review our [return policy](https://example.com/returns) for the full process. You'll need to fill out the [return form](https://example.com/returns/form) and include your order number."