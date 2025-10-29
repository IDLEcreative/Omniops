# ResponseParser Quick Reference

**File:** `/Users/jamesguy/Omniops/lib/chat/response-parser.ts`
**LOC:** 208 | **Tests:** 23/23 ✅ | **Status:** Production Ready

---

## Quick Start

```typescript
import { parseAndTrackEntities } from '@/lib/chat/response-parser';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';

// In your chat API route:
const metadata = new ConversationMetadataManager();

await parseAndTrackEntities(
  aiResponse,      // AI's response
  userMessage,     // User's message
  metadata         // Metadata manager
);
```

---

## What It Detects

### ✅ Corrections (5 patterns)
- "Sorry, I meant blue not red"
- "not red but blue"
- "red -> blue"
- "I said large, not medium"
- "it's premium not basic"

### ✅ Products (markdown links)
- `[Product Name](url)` → Tracked with aliases
- Filters: "click here", docs/help links

### ✅ Orders
- "order #12345"
- "order ABC123"
- Alphanumeric IDs, optional #

### ✅ Lists (2+ items)
- `1. [Item](url)` (numbered)
- `- [Item](url)` (dashed)
- `• [Item](url)` (bulleted)

---

## API

### ResponseParser.parseResponse()
```typescript
static parseResponse(
  userMessage: string,
  aiResponse: string,
  turnNumber: number
): ParsedResponse
```

**Returns:**
```typescript
{
  entities: ConversationEntity[],
  corrections: Array<{ original: string; corrected: string }>,
  lists: Array<{ items: Array<{ name: string; url?: string }> }>
}
```

### parseAndTrackEntities()
```typescript
async function parseAndTrackEntities(
  aiResponse: string,
  userMessage: string,
  metadataManager: ConversationMetadataManager
): Promise<void>
```

**Automatically:**
- Parses response
- Tracks all entities
- Tracks all corrections
- Tracks all lists

---

## Regex Patterns Cheat Sheet

| Pattern | Regex | Example |
|---------|-------|---------|
| Correction 1 | `/(?:sorry\|actually\|no\|wait)[,\s]+(?:i\s+meant\|it'?s\|i\s+said)\s+([^\s,]+)\s+(?:not\|instead\s+of)\s+([^\s,]+)/i` | "Sorry, I meant X not Y" |
| Correction 2 | `/not\s+([^\s,]+)[,\s]*(?:but\|it'?s)\s+([^\s,]+)/i` | "not Y but X" |
| Correction 3 | `/([^\s,]+)\s*(?:→\|->) \s*([^\s,]+)/` | "Y -> X" |
| Products | `/\[([^\]]+)\]\(([^)]+)\)/g` | `[Name](url)` |
| Orders | `/order\s*#?([a-zA-Z0-9]+)/gi` | "order #123" |
| Lists | `/(?:^\|\n)[\s]*(?:[•\-*]\|\d+\.)\s*\[([^\]]+)\]\(([^)]+)\)/gm` | `1. [Item](url)` |

---

## Edge Cases Handled

✅ Empty messages → Returns empty results
✅ Long corrections (>50 chars) → Ignored
✅ Generic link text → Filtered out
✅ Malformed markdown → Gracefully skipped
✅ Non-product URLs → Filtered out

---

## Testing

```bash
# Run all tests
npx tsx test-response-parser.ts

# Check TypeScript
npx tsc --noEmit lib/chat/response-parser.ts
```

---

## Integration Points

**Chat API:** Add to `/Users/jamesguy/Omniops/app/api/chat/route.ts`

```typescript
// After generating AI response:
await parseAndTrackEntities(aiResponse, userMessage, metadata);
```

---

## Performance

- **Time Complexity:** O(n) linear
- **Memory:** O(m) where m = matches
- **Execution:** <100ms for typical responses
- **No external deps:** Only internal imports

---

**Full Docs:** See `docs/response-parser-patterns.md`
**Report:** See `RESPONSE_PARSER_IMPLEMENTATION_REPORT.md`
