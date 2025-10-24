# Intelligent AI Search System Implementation Guide

## Overview

A new intelligent AI chat system with OpenAI function calling capabilities has been implemented at `/app/api/chat/route-intelligent.ts`. This system allows the AI to iteratively search for information using the ReAct pattern instead of pre-loading fixed context.

## Key Features

### 🔧 Function Calling Tools

The AI has access to 3 specialized search tools:

1. **search_products** - General product searches, brand queries
2. **search_by_category** - Category/topic searches (policies, guides)  
3. **get_product_details** - Detailed product information with specs

### 🧠 ReAct Pattern Implementation

```
1. REASON: Analyze what the user is asking for
2. ACT: Use appropriate search tools to gather information
3. OBSERVE: Review the search results
4. REASON: Determine if you need more information or can respond  
5. ACT: Search again if needed, or provide the final response
```

### ⚙️ Configuration Options

```typescript
config: {
  ai: {
    maxSearchIterations: 3,     // Max search calls (1-5)
    searchTimeout: 10000,       // Timeout per search (ms)
  }
}
```

## Implementation Details

### Search Tool Functions

#### search_products
- **Purpose**: Find products, brands, specific items
- **Strategy**: WooCommerce API first, semantic search fallback
- **Parameters**: query (string), limit (number, default: 8, max: 20)
- **Example**: "Cifa hydraulic pump", "torque wrench parts"

#### search_by_category  
- **Purpose**: General topics, policies, guides
- **Strategy**: Semantic search with lower threshold (0.15)
- **Parameters**: category (string), limit (number, default: 6, max: 15)
- **Example**: "contact information", "shipping policy", "installation guides"

#### get_product_details
- **Purpose**: Detailed product specs and features
- **Strategy**: Enhanced query + higher threshold (0.3)
- **Parameters**: productQuery (string), includeSpecs (boolean, default: true)
- **Example**: "DC66-10P Agri Flip specifications"

### Error Handling & Timeouts

- **Timeout Protection**: 10 second default per search call
- **Graceful Fallbacks**: Failed searches return empty results
- **Error Recovery**: AI can adapt when searches fail
- **Iteration Limits**: Max 3 search iterations to prevent infinite loops

### Search Flow Examples

#### Simple Product Query
```
User: "Show me Cifa pumps"
→ AI calls search_products("Cifa pumps", 8)
→ Returns WooCommerce/semantic results
→ AI formats response with products
```

#### Complex Multi-Search
```
User: "I need a hydraulic pump for agricultural use"
→ AI calls search_products("hydraulic pump agricultural", 8)
→ Reviews results, needs more specific info
→ AI calls get_product_details("agricultural hydraulic pump specifications")  
→ AI synthesizes final response with both result sets
```

## System Prompts

The AI is configured with:
- **Core Principles**: Helpful, conversational, professional
- **Search Strategy**: Clear ReAct pattern guidelines
- **Response Formatting**: Proper markdown, bullet points
- **Important**: Never invent information, always search for facts

## Response Format

- Uses bullet points (•) for product lists
- Includes prices when available: `[Product Name](url) - £price`
- Only links to same-domain URLs
- Concise but informative responses
- Acknowledges when information comes from search results

## Integration Benefits

### vs Current System
- **Current**: Pre-searches and gives AI fixed context
- **New**: AI searches iteratively based on actual need
- **Benefit**: More targeted, accurate, and complete information

### Search Efficiency
- **Smart Tool Selection**: AI chooses most appropriate search method
- **Result Combination**: Can combine multiple search results
- **Adaptive**: Refines search based on initial results

### User Experience
- **Dynamic**: Searches based on actual query intent
- **Complete**: Can gather comprehensive information across searches
- **Accurate**: No hallucination - only uses found information

## Logging & Debugging

### Search Activity Tracking
```javascript
searchMetadata: {
  iterations: 2,
  totalSearches: 3,
  searchLog: [
    { tool: "search_products", query: "Cifa pump", resultCount: 5, source: "woocommerce" },
    { tool: "get_product_details", query: "DC66-10P specs", resultCount: 3, source: "semantic" }
  ]
}
```

### Console Logging
- `[Function Call]` - Search tool execution details
- `[Intelligent Chat]` - ReAct loop progress and decisions
- Search timing, result counts, and source tracking

## API Endpoint

### Request Format
```typescript
POST /api/chat/route-intelligent
{
  message: string,
  conversation_id?: string,
  session_id: string,
  domain?: string,
  config?: {
    ai?: {
      maxSearchIterations?: number,    // 1-5, default 3
      searchTimeout?: number,          // 1000-30000ms, default 10000
    }
  }
}
```

### Response Format
```typescript
{
  message: string,
  conversation_id: string,
  sources?: Array<{
    url: string,
    title: string,
    relevance: number
  }>,
  searchMetadata?: {
    iterations: number,
    totalSearches: number,
    searchLog: Array<SearchLogEntry>
  }
}
```

## Testing

A test script is available at `/test-intelligent-search.ts`:

```bash
npx tsx test-intelligent-search.ts
```

Tests all search components and simulates function calling behavior.

## Deployment Notes

### Environment Requirements
- OpenAI API key with function calling support
- Supabase connection for search data
- WooCommerce credentials for product searches

### Performance Considerations
- Max 3 search iterations prevents long response times
- 10s timeout per search call
- Results cached by existing search infrastructure
- Concurrent tool execution within single iteration

### Compatibility
- Works with existing chat infrastructure
- Maintains conversation history
- Uses same rate limiting and validation
- Compatible with domain-specific configurations

## Migration Path

### From Current System
1. Test the new route: `/api/chat/route-intelligent`
2. Compare responses with current `/api/chat/route`
3. Update frontend to use new endpoint
4. Monitor search metadata and performance
5. Fine-tune search parameters based on usage

### Configuration Migration
No breaking changes to existing config structure. New AI config is optional:

```typescript
// Existing config continues to work
config: {
  features: { 
    woocommerce: { enabled: true },
    websiteScraping: { enabled: true }
  }
  // New optional AI config
  ai: {
    maxSearchIterations: 3,
    searchTimeout: 10000
  }
}
```

## Success Metrics

### Quality Indicators
- **Search Relevance**: Average similarity scores of returned results
- **Search Efficiency**: Number of iterations needed per query type
- **Response Accuracy**: Reduction in hallucinated information
- **User Satisfaction**: Improved product finding and information accuracy

### Performance Metrics  
- **Response Time**: Total time including all search iterations
- **Search Success Rate**: Percentage of searches returning useful results
- **Tool Usage**: Distribution of search tool usage patterns
- **Error Rate**: Failed searches and timeout occurrences

## Support & Troubleshooting

### Common Issues
1. **No Search Results**: Check domain configuration and data availability
2. **Timeout Errors**: Increase `searchTimeout` in config
3. **Too Many Iterations**: Reduce `maxSearchIterations` for faster responses
4. **WooCommerce Failures**: Verify credentials and API access

### Debug Tips
- Monitor console logs for `[Function Call]` and `[Intelligent Chat]` messages
- Check `searchMetadata` in response for search activity details
- Use test script to validate search components independently
- Verify domain mapping and data availability

---

## Next Steps

1. **Test thoroughly** with various query types
2. **Monitor performance** in production environment  
3. **Fine-tune prompts** based on user interactions
4. **Expand tools** if needed for specialized searches
5. **Optimize timeouts** based on actual search performance

The intelligent search system provides a more dynamic and accurate chat experience by allowing the AI to search iteratively for exactly what users need, when they need it.