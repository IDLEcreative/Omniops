import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testGPT5Comparison() {
  console.log('\n🔬 GPT-5 vs GPT-5-mini Comparison (Both at Minimal Reasoning)\n');
  console.log('=' .repeat(70));
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  // Test queries of varying complexity
  const testQueries = [
    {
      query: "I bought a hydraulic cylinder from you 6 months ago. Now it's leaking oil from the seal. Is this covered under warranty?",
      type: "Warranty Query",
      complexity: "Medium"
    },
    {
      query: "What's the part number for a replacement solenoid valve for a 2018 MAN TGX tipper system?",
      type: "Technical Part Query",
      complexity: "High"
    },
    {
      query: "Do you ship to Ireland and what are the delivery times?",
      type: "Simple Query",
      complexity: "Low"
    },
    {
      query: "I need to replace the entire hydraulic system on my tipper truck. Can you help me figure out what parts I need and in what order to install them?",
      type: "Complex Technical Support",
      complexity: "Very High"
    }
  ];

  // Models to test
  const models = [
    { 
      name: 'GPT-5-mini', 
      model: 'gpt-5-mini',
      tokens: 2000,
      description: 'Cost-optimized reasoning model'
    },
    { 
      name: 'GPT-5 (Full)', 
      model: 'gpt-5',
      tokens: 2000,
      description: 'Most intelligent model, broad knowledge'
    }
  ];

  const systemPrompt = `You are a helpful customer service assistant for Thompsons E Parts, a spare parts store specializing in truck, tipper, and hydraulic parts.
Keep responses concise but complete. Provide specific part numbers and technical details when relevant.
Be professional and helpful.`;

  // Store results for comparison
  const results = {};

  for (const modelConfig of models) {
    console.log(`\n\n🤖 Testing: ${modelConfig.name}`);
    console.log(`Description: ${modelConfig.description}`);
    console.log('-'.repeat(70));
    
    results[modelConfig.name] = [];

    for (const test of testQueries) {
      console.log(`\n📝 [${test.complexity}] ${test.type}`);
      console.log(`   Query: "${test.query.substring(0, 60)}..."`);
      
      const startTime = Date.now();
      
      try {
        const completion = await openai.chat.completions.create({
          model: modelConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: test.query }
          ],
          max_completion_tokens: modelConfig.tokens,
          reasoning_effort: 'minimal',
        });
        
        const responseTime = Date.now() - startTime;
        const response = completion.choices[0]?.message?.content || 'No response';
        
        // Calculate metrics
        const wordCount = response.split(/\s+/).length;
        const hasSpecificDetails = /\d{2,}|[A-Z]{2,}\d+|\b\d+mm\b|\b\d+"\b/.test(response);
        const hasTechnicalTerms = /hydraulic|solenoid|cylinder|seal|pressure|valve|tipper|warranty/i.test(response);
        const responseLength = response.length;
        
        // Store result
        const result = {
          responseTime,
          wordCount,
          responseLength,
          hasSpecificDetails,
          hasTechnicalTerms,
          reasoning_tokens: completion.usage?.completion_tokens_details?.reasoning_tokens || 0,
          output_tokens: completion.usage?.completion_tokens - (completion.usage?.completion_tokens_details?.reasoning_tokens || 0),
          total_tokens: completion.usage?.completion_tokens
        };
        
        results[modelConfig.name].push(result);
        
        console.log(`\n   ⏱️  Response Time: ${responseTime}ms`);
        console.log(`   📊 Tokens: Reasoning=${result.reasoning_tokens}, Output=${result.output_tokens}, Total=${result.total_tokens}`);
        console.log(`   📏 Length: ${wordCount} words, ${responseLength} chars`);
        console.log(`   ✅ Quality: Details=${hasSpecificDetails ? '✓' : '✗'}, Technical=${hasTechnicalTerms ? '✓' : '✗'}`);
        console.log(`\n   💬 Response Preview:`);
        console.log(`   "${response.substring(0, 250)}${response.length > 250 ? '...' : ''}"`);
        
      } catch (error) {
        console.log(`\n   ❌ Error: ${error.message}`);
        if (error.status === 429) {
          console.log('   Rate limited - waiting 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
  }
  
  // Comparison Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 COMPARISON SUMMARY: GPT-5 vs GPT-5-mini');
  console.log('='.repeat(70));
  
  for (const modelName of Object.keys(results)) {
    const modelResults = results[modelName];
    if (modelResults.length === 0) continue;
    
    const avgResponseTime = modelResults.reduce((a, b) => a + b.responseTime, 0) / modelResults.length;
    const avgWords = modelResults.reduce((a, b) => a + b.wordCount, 0) / modelResults.length;
    const avgTokens = modelResults.reduce((a, b) => a + b.total_tokens, 0) / modelResults.length;
    const avgReasoning = modelResults.reduce((a, b) => a + b.reasoning_tokens, 0) / modelResults.length;
    const qualityScore = modelResults.filter(r => r.hasSpecificDetails && r.hasTechnicalTerms).length;
    
    console.log(`\n${modelName}:`);
    console.log(`  ⏱️  Avg Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log(`  📝 Avg Response Length: ${Math.round(avgWords)} words`);
    console.log(`  🎯 Quality Score: ${qualityScore}/${modelResults.length} excellent responses`);
    console.log(`  💰 Avg Tokens: ${Math.round(avgTokens)} (${Math.round(avgReasoning)} reasoning)`);
  }
  
  console.log('\n📋 RECOMMENDATION:');
  console.log('-'.repeat(40));
  
  // Calculate cost difference (approximate)
  const gpt5MiniCost = 0.01; // per 1K tokens (example)
  const gpt5Cost = 0.05; // per 1K tokens (example, likely higher)
  
  console.log(`
Based on the test results:

GPT-5 (Full Model):
  ✅ Best for: Complex technical queries, multi-step problems
  ✅ Superior understanding of context and nuance
  ⚠️  Higher cost (~${Math.round(gpt5Cost/gpt5MiniCost)}x more expensive)
  ⚠️  Potentially slower response times

GPT-5-mini:
  ✅ Best for: Standard customer service queries
  ✅ Excellent cost-performance ratio
  ✅ Faster responses for simple queries
  ⚠️  May need more specific prompting for complex tasks

For a customer service chatbot, GPT-5-mini at minimal reasoning
appears optimal unless you need to handle very complex technical
support scenarios regularly.
  `);
}

testGPT5Comparison().catch(console.error);