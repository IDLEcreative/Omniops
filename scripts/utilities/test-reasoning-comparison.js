import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testReasoningComparison() {
  console.log('\n🔬 GPT-5-mini Reasoning Effort Comparison Test\n');
  console.log('=' * 60);
  
  // Test queries that benefit from reasoning
  const testQueries = [
    {
      query: "I ordered a hydraulic pump last week but it's making a strange whining noise when I use it. What should I do?",
      type: "Complex Customer Issue"
    },
    {
      query: "What's the difference between your standard and heavy-duty brake pads, and which would you recommend for a delivery truck doing 100 miles daily in city traffic?",
      type: "Technical Recommendation"
    },
    {
      query: "Do you have part number DC66-10P in stock?",
      type: "Simple Inventory Check"
    }
  ];

  // Test configurations
  const configs = [
    { 
      name: 'MINIMAL (Current - 2000 tokens)', 
      effort: 'minimal', 
      tokens: 2000,
      description: 'Fast responses, basic reasoning'
    },
    { 
      name: 'MEDIUM (5000 tokens)', 
      effort: 'medium', 
      tokens: 5000,
      description: 'Balanced reasoning and response quality'
    }
  ];

  for (const config of configs) {
    console.log(`\n\n🎯 Testing: ${config.name}`);
    console.log(`Configuration: ${config.description}`);
    console.log('-'.repeat(60));

    for (const test of testQueries) {
      console.log(`\n📝 ${test.type}: "${test.query.substring(0, 60)}..."`);
      
      const startTime = Date.now();
      
      try {
        // Make direct OpenAI API call to test different configurations
        import OpenAI from 'openai';
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const systemPrompt = `You are a helpful customer service assistant for a spare parts store.
        Keep responses concise and helpful. Provide specific recommendations when asked.`;
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-5-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: test.query }
          ],
          max_completion_tokens: config.tokens,
          reasoning_effort: config.effort,
        });
        
        const responseTime = Date.now() - startTime;
        const response = completion.choices[0]?.message?.content || 'No response';
        
        console.log(`\n⏱️  Response Time: ${responseTime}ms`);
        console.log(`📊 Token Usage:`);
        console.log(`   - Reasoning: ${completion.usage?.completion_tokens_details?.reasoning_tokens || 0}`);
        console.log(`   - Output: ${completion.usage?.completion_tokens - (completion.usage?.completion_tokens_details?.reasoning_tokens || 0)}`);
        console.log(`   - Total: ${completion.usage?.completion_tokens}`);
        
        console.log(`\n💬 Response Quality:`);
        if (response && response !== 'No response') {
          console.log(`   Length: ${response.length} chars`);
          console.log(`   Preview: ${response.substring(0, 300)}${response.length > 300 ? '...' : ''}`);
          
          // Simple quality metrics
          const hasSpecifics = /\d+|specific|exactly|precisely/.test(response.toLowerCase());
          const hasActionItems = /should|recommend|suggest|try|check/.test(response.toLowerCase());
          const hasProfessional = /apologize|sorry|understand|help|assist/.test(response.toLowerCase());
          
          console.log(`\n   ✓ Quality Indicators:`);
          console.log(`     • Specific details: ${hasSpecifics ? '✅' : '❌'}`);
          console.log(`     • Action items: ${hasActionItems ? '✅' : '❌'}`);
          console.log(`     • Professional tone: ${hasProfessional ? '✅' : '❌'}`);
        } else {
          console.log('   ❌ No response generated');
        }
        
      } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n\n' + '=' * 60);
  console.log('📈 COMPARISON SUMMARY');
  console.log('=' * 60);
  console.log(`
MINIMAL REASONING (Current Setup):
  ✅ Fastest response times
  ✅ Good for simple queries
  ⚠️  May lack depth on complex issues
  
MEDIUM REASONING (5000 tokens):
  ✅ Better handling of complex queries
  ✅ More thoughtful responses
  ⚠️  Slower response times
  ⚠️  Higher token usage/cost
  
RECOMMENDATION:
  For customer service chatbot, MINIMAL is likely sufficient
  since most queries are straightforward. Consider MEDIUM
  only for premium support or complex technical inquiries.
  `);
}

testReasoningComparison().catch(console.error);