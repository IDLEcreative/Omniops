# Chat System Quick Reference

**Quick navigation guide for the OmniOps Chat System documentation.**

## I want to...

### Get Started
- **Understand the system** → [README.md#overview](./README.md#overview)
- **See architecture** → [README.md#architecture](./README.md#architecture)
- **Configure the system** → [README.md#configuration](./README.md#configuration)

### Implement Features
- **Use the API** → [README.md#api-reference](./README.md#api-reference)
- **Manage conversations** → [README.md#conversation-management](./README.md#conversation-management)
- **Implement search** → [README.md#search-integration-rag](./README.md#search-integration-rag)
- **Add tool calling** → [README.md#tool-calling](./README.md#tool-calling)

### Prevent Issues
- **Stop hallucinations** → [hallucination-prevention.md](./hallucination-prevention.md)
- **Handle errors** → [README.md#troubleshooting](./README.md#troubleshooting)
- **Optimize performance** → [README.md#performance--scaling](./README.md#performance--scaling)

### Test & Debug
- **Run tests** → [README.md#testing](./README.md#testing)
- **Check hallucinations** → [hallucination-prevention.md#testing](./hallucination-prevention.md#testing)
- **Debug issues** → [README.md#troubleshooting](./README.md#troubleshooting)

### Learn More
- **Compare routes** → [../../CHAT_ROUTES_COMPARISON.md](../../CHAT_ROUTES_COMPARISON.md)
- **Understand search** → [../../SEARCH_ARCHITECTURE.md](../../SEARCH_ARCHITECTURE.md)
- **Performance details** → [../../PERFORMANCE_OPTIMIZATION.md](../../PERFORMANCE_OPTIMIZATION.md)

## Common Tasks

### Send a chat message
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Your message here',
    session_id: crypto.randomUUID(),
    domain: 'example.com'
  })
});
```
[Full API Reference →](./README.md#api-reference)

### Run hallucination tests
```bash
npx tsx test-hallucination-prevention.ts
```
[Full Testing Guide →](./hallucination-prevention.md#testing)

### Configure response mode
```bash
# Concise responses (recommended)
USE_SIMPLIFIED_PROMPT=true

# Detailed responses
USE_SIMPLIFIED_PROMPT=false
```
[Full Configuration →](./README.md#configuration)

### Check conversation history
```typescript
const history = await getConversationHistory(conversationId, limit: 10);
```
[Full Conversation Guide →](./README.md#conversation-management)

## File Reference

| File | Purpose | Lines | Topics |
|------|---------|-------|--------|
| **README.md** | Main documentation | 788 | Architecture, API, Testing, Config |
| **hallucination-prevention.md** | Anti-hallucination guide | 610 | Prevention, Testing, Best Practices |
| **CONSOLIDATION_SUMMARY.md** | Consolidation details | 308 | What changed, metrics, benefits |
| **QUICK_REFERENCE.md** | This file | - | Quick navigation |

## Related Documentation

- **[Chat Routes Comparison](../../CHAT_ROUTES_COMPARISON.md)** - Basic vs Intelligent routes
- **[Search Architecture](../../SEARCH_ARCHITECTURE.md)** - Search internals (100-200 results!)
- **[Performance Optimization](../../PERFORMANCE_OPTIMIZATION.md)** - Response time analysis
- **[Chat Improvements Summary](../../implementation/CHAT_IMPROVEMENTS_SUMMARY.md)** - Recent changes
- **[Supabase Schema](../SUPABASE_SCHEMA.md)** - Database structure

## Need Help?

1. **Can't find information?** → Search README.md table of contents
2. **Hallucination issues?** → See [hallucination-prevention.md](./hallucination-prevention.md)
3. **Performance problems?** → See [README.md#performance--scaling](./README.md#performance--scaling)
4. **Code not working?** → See [README.md#troubleshooting](./README.md#troubleshooting)
5. **Still stuck?** → Check related documentation above

---

**Last Updated**: October 2024
