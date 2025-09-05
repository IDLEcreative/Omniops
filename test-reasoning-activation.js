const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

async function testReasoningActivation() {
  console.log('\n🔍 Testing GPT-5-mini Reasoning Activation\n');
  console.log('=' .repeat(60));
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  // Different configurations to test
  const configs = [
    {
      name: 'Current (minimal effort)',
      params: {
        model: 'gpt-5-mini',
        max_completion_tokens: 2000,
        reasoning_effort: 'minimal'
      }
    },
    {
      name: 'Low effort',
      params: {
        model: 'gpt-5-mini',
        max_completion_tokens: 2000,
        reasoning_effort: 'low'
      }
    },
    {
      name: 'Medium effort',
      params: {
        model: 'gpt-5-mini',
        max_completion_tokens: 3000,
        reasoning_effort: 'medium'
      }
    },
    {
      name: 'With explicit reasoning prompt',
      params: {
        model: 'gpt-5-mini',
        max_completion_tokens: 2000,
        reasoning_effort: 'minimal'
      },
      systemPrompt: `You are a helpful assistant. Before answering, think step-by-step about the query.`
    },
    {
      name: 'Using developer message',
      params: {
        model: 'gpt-5-mini',
        max_completion_tokens: 2000,
        reasoning_effort: 'minimal'
      },
      useDeveloper: true
    }
  ];

  const testQuery = "A customer says their hydraulic pump is making noise and losing pressure. What could be the issue and how should they fix it?";

  for (const config of configs) {
    console.log(`\n📝 Testing: ${config.name}`);
    console.log('-'.repeat(60));
    
    try {
      const messages = [];
      
      // Add developer message if specified
      if (config.useDeveloper) {
        messages.push({
          role: 'developer',
          content: 'Think through this problem step-by-step before providing your answer.'
        });
      }
      
      // Add system message
      messages.push({
        role: 'system',
        content: config.systemPrompt || 'You are a helpful customer service assistant.'
      });
      
      // Add user message
      messages.push({
        role: 'user',
        content: testQuery
      });
      
      const startTime = Date.now();
      const completion = await openai.chat.completions.create({
        ...config.params,
        messages
      });
      
      const responseTime = Date.now() - startTime;
      const usage = completion.usage;
      const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens || 0;
      const outputTokens = usage?.completion_tokens - reasoningTokens;
      
      console.log(`⏱️  Response Time: ${responseTime}ms`);
      console.log(`🧠 Reasoning Tokens: ${reasoningTokens}`);
      console.log(`💬 Output Tokens: ${outputTokens}`);
      console.log(`📊 Total Tokens: ${usage?.completion_tokens}`);
      
      // Check if reasoning occurred
      if (reasoningTokens > 0) {
        console.log(`✅ REASONING ACTIVATED! (${Math.round(reasoningTokens / usage?.completion_tokens * 100)}% of tokens)`);
      } else {
        console.log(`❌ No reasoning tokens used`);
      }
      
      const response = completion.choices[0]?.message?.content;
      console.log(`\n📝 Response preview:`);
      console.log(response?.substring(0, 200) + '...');
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('💡 INSIGHTS:');
  console.log('='.repeat(60));
  console.log(`
If reasoning tokens are still 0:
1. The 'reasoning_effort' parameter might not be properly supported
2. GPT-5-mini might need the new Responses API instead of Chat Completions
3. The model might need explicit prompting to activate reasoning
4. Consider using 'developer' role messages to trigger reasoning

Recommended next steps:
- Try the Responses API if available
- Use explicit "think step-by-step" prompts
- Consider if reasoning is actually needed for customer service
  `);
}

testReasoningActivation().catch(console.error);