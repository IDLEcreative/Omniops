# Agentic Search Capabilities Test Suite

This comprehensive test suite evaluates whether your chat system exhibits true agentic search behavior versus simple tool-calling patterns.

## What is Agentic Behavior?

**Agentic systems** demonstrate autonomous reasoning, adaptation, and iterative improvement. They don't just execute tools when asked - they think about strategy, evaluate results, and refine their approach.

**Simple tool-calling systems** execute predefined functions when triggered by keywords or patterns, without reasoning about strategy or result quality.

## Test Categories

### 1. Autonomous Strategy Selection (25 points)
**Tests whether the system chooses different approaches for different query types.**

- **Agentic**: Uses different search strategies, iteration counts, and source types based on query complexity
- **Non-agentic**: Same approach regardless of query type

**Test Queries:**
- "Show me all brake products" → Should use product search strategy
- "What is your return policy?" → Should use information search strategy  
- "How do I install brake pads?" → Should use mixed/instructional strategy

### 2. Iterative Refinement (25 points)  
**Tests the ability to improve results through multiple search attempts.**

- **Agentic**: Re-searches with refined queries when initial results are poor
- **Non-agentic**: Single search attempt regardless of result quality

**Test Queries:**
- "Find products for a 2010 vehicle" → Should ask for clarification or search multiple categories
- "Show me the best brakes" → Should search multiple product types
- "I need parts for maintenance" → Should refine vague query

### 3. Result Quality Awareness (25 points)
**Tests ability to assess and communicate search result quality.**

- **Agentic**: Acknowledges when results are poor, offers alternatives, shows uncertainty
- **Non-agentic**: Over-confident responses, doesn't recognize poor results

**Test Queries:**
- "Find products for a 1995 Trabant" → Should acknowledge limited results for obscure vehicle
- "What is the quantum mechanics of brake fluid?" → Should recognize nonsensical query

### 4. Multi-turn Context Memory (15 points)
**Tests ability to maintain context across conversation turns.**

- **Agentic**: Builds on previous context, maintains conversation coherence
- **Non-agentic**: Each turn is independent, no context retention

**Test Conversation:**
1. "I need brake pads for my Honda"
2. "What about the 2015 model?"
3. "Show me the cheapest option" 
4. "Do you have installation instructions?"

### 5. Dynamic Iteration Control (10 points)
**Tests adaptive search effort based on query complexity.**

- **Agentic**: More iterations for complex queries, fewer for simple ones
- **Non-agentic**: Fixed iteration pattern regardless of complexity

## Running the Tests

### Prerequisites
1. Development server running on port 3000: `npm run dev`
2. Proper environment variables configured (OpenAI, Supabase, etc.)

### Quick Start
```bash
# Using the test runner (recommended)
./run-agentic-test.sh

# Or directly with npx
npx tsx test-agentic-search-capabilities.ts

# With verbose output
./run-agentic-test.sh --verbose

# Against production/staging
./run-agentic-test.sh --url=https://your-domain.com
```

### Output Interpretation

The test generates a comprehensive report with:

- **Overall Score (0-100)**: Average across all test categories
- **Classification**: 
  - 80-100: Highly Agentic (🤖)
  - 60-79: Moderately Agentic (⚡) 
  - 40-59: Basic Tool-Calling (🔧)
  - 0-39: Simple Tool-Calling (📞)

- **Individual Test Results**: Detailed breakdown per category
- **Agentic Behaviors Detected**: Positive indicators found
- **Simple Tool-Call Indicators**: Non-agentic patterns identified
- **Capability Analysis**: Detailed assessment per capability
- **Recommendations**: Specific improvements for enhanced agentic behavior

## Sample Output

```
🎯 OVERALL ASSESSMENT:
   Average Score: 72/100
   Tests Passed: 4/5
   Classification: ⚡ MODERATELY AGENTIC - Some autonomous behaviors present

📋 DETAILED TEST RESULTS:

1. Autonomous Strategy Selection
   ✅ PASS - Score: 75/100
   🤖 Agentic Behaviors:
      • Different search iteration counts for different query types
      • Appropriate content type matching for different queries

2. Iterative Refinement  
   ✅ PASS - Score: 68/100
   🤖 Agentic Behaviors:
      • Multiple searches performed (3)
      • Uses clarifying language

🚀 RECOMMENDATIONS FOR ENHANCED AGENTIC BEHAVIOR:
   1. IMPLEMENT EXPLICIT AGENT REASONING
   2. ENHANCE ITERATION CONTROL  
   3. IMPROVE CONTEXT AWARENESS
```

## Understanding Your Results

### High Scores (70-100) Indicate:
- ✅ True agentic reasoning and adaptation
- ✅ Quality-aware search strategies  
- ✅ Context-aware conversation handling
- ✅ Iterative improvement capabilities

### Low Scores (0-40) Indicate:
- ❌ Simple keyword-triggered tool execution
- ❌ No quality assessment or refinement
- ❌ Fixed processing patterns
- ❌ Poor context retention

### Improvement Strategies

**For Low Scores:**
1. **Add Agent Reasoning Loops**: Implement explicit decision-making about search strategies
2. **Quality Assessment**: Add mechanisms to evaluate search result quality
3. **Iterative Refinement**: Create feedback loops that retry with improved queries
4. **Context Memory**: Implement conversation state tracking across turns

**For Moderate Scores:**
1. **Fine-tune Existing Logic**: Optimize existing agentic behaviors
2. **Add Uncertainty Quantification**: Better communicate confidence levels
3. **Enhance Strategy Selection**: More sophisticated query analysis for strategy choice

## Technical Details

### Test Configuration
- **Default Target**: `http://localhost:3000/api/chat-intelligent`
- **Test Domain**: `thompsonseparts.co.uk` (matches system default)
- **Timeout**: 30 seconds per request
- **Max Iterations**: Allows up to 5 search iterations to test system limits

### Test Data Collection
The test collects:
- Response times and iteration counts
- Source quality and relevance scores  
- Context retention across conversation turns
- Language patterns indicating reasoning vs. simple responses
- Search strategy variance across different query types

### Integration with Existing System
The test uses your existing API endpoints and doesn't require any code changes. It evaluates behavior through:
- Request/response analysis
- Timing pattern analysis  
- Content quality assessment
- Conversation flow evaluation

## Troubleshooting

**Server Connection Issues:**
- Ensure development server is running: `npm run dev`
- Check port 3000 is available: `lsof -i :3000`  
- Verify environment variables are configured

**Test Failures:**
- Check OpenAI API key is configured
- Verify Supabase connection is working
- Ensure Redis is running for background jobs
- Review recent error logs

**Unexpected Results:**
- Run with `--verbose` for detailed request/response logging
- Check if rate limiting is affecting test execution
- Verify test domain has scraped content available

---

**This test suite provides objective, measurable assessment of your system's agentic capabilities and actionable recommendations for improvement.**