import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testOptimalReasoning() {
  console.log('\n🔬 Testing Optimal Reasoning Level for Customer Service\n');
  console.log('=' .repeat(70));
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  // Real customer service scenarios
  const testScenarios = [
    {
      query: "I need help choosing between your standard and premium hydraulic cylinders for a tipper truck that does 20 lifts per day.",
      type: "Product Selection",
      needsReasoning: "HIGH"
    },
    {
      query: "Do you have DC66-10P in stock?",
      type: "Simple Inventory",
      needsReasoning: "LOW"
    },
    {
      query: "My hydraulic pump started leaking after 3 months. It's making a whining noise and the pressure dropped from 2500 PSI to 1800 PSI. What's wrong?",
      type: "Technical Diagnosis",
      needsReasoning: "HIGH"
    },
    {
      query: "What are your delivery times to London?",
      type: "Simple Info",
      needsReasoning: "LOW"
    },
    {
      query: "I bought the wrong part by mistake yesterday. Can I return it?",
      type: "Return Query",
      needsReasoning: "MEDIUM"
    }
  ];

  // Test configurations
  const configs = [
    { name: 'LOW (Current)', effort: 'low', tokens: 2500 },
    { name: 'MEDIUM', effort: 'medium', tokens: 3500 },
    { name: 'LOW with More Tokens', effort: 'low', tokens: 3500 }
  ];

  const results = {};
  
  for (const config of configs) {
    console.log(`\n\n🎯 Testing: ${config.name} Reasoning`);
    console.log(`Settings: ${config.effort} effort, ${config.tokens} max tokens`);
    console.log('-'.repeat(70));
    
    results[config.name] = {
      totalTime: 0,
      totalReasoning: 0,
      qualityScores: [],
      responses: []
    };

    for (const scenario of testScenarios) {
      console.log(`\n📝 [${scenario.needsReasoning}] ${scenario.type}`);
      
      const startTime = Date.now();
      
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-5-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful customer service assistant for Thompsons E Parts. Be concise but thorough.'
            },
            { role: 'user', content: scenario.query }
          ],
          max_completion_tokens: config.tokens,
          reasoning_effort: config.effort,
        });
        
        const responseTime = Date.now() - startTime;
        const reasoning = completion.usage?.completion_tokens_details?.reasoning_tokens || 0;
        const output = completion.usage?.completion_tokens - reasoning;
        const response = completion.choices[0]?.message?.content || '';
        
        // Quality scoring
        let qualityScore = 0;
        
        // Check for specific quality indicators based on query type
        if (scenario.needsReasoning === 'HIGH') {
          // For complex queries, check for analysis depth
          if (response.includes('because') || response.includes('since')) qualityScore++;
          if (response.includes('recommend') || response.includes('suggest')) qualityScore++;
          if (/\d+/.test(response)) qualityScore++; // Has specific numbers
          if (response.length > 500) qualityScore++; // Thorough response
          if (response.includes('option') || response.includes('alternative')) qualityScore++;
        } else {
          // For simple queries, check for directness and clarity
          if (response.length < 300) qualityScore += 2; // Concise
          if (response.includes('yes') || response.includes('no')) qualityScore++; // Direct answer
          if (!response.includes('however') && !response.includes('but')) qualityScore++; // Not over-complicated
        }
        
        results[config.name].totalTime += responseTime;
        results[config.name].totalReasoning += reasoning;
        results[config.name].qualityScores.push(qualityScore);
        results[config.name].responses.push(response);
        
        console.log(`  ⏱️  Time: ${responseTime}ms`);
        console.log(`  🧠 Reasoning: ${reasoning} tokens (${Math.round(reasoning/(reasoning+output)*100)}%)`);
        console.log(`  📝 Output: ${output} tokens`);
        console.log(`  ⭐ Quality Score: ${qualityScore}/5`);
        console.log(`  Preview: "${response.substring(0, 150)}..."`);
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Analysis
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 ANALYSIS: Optimal Reasoning Level');
  console.log('='.repeat(70));
  
  for (const [name, data] of Object.entries(results)) {
    const avgTime = Math.round(data.totalTime / testScenarios.length);
    const avgReasoning = Math.round(data.totalReasoning / testScenarios.length);
    const avgQuality = (data.qualityScores.reduce((a,b) => a+b, 0) / data.qualityScores.length).toFixed(1);
    
    console.log(`\n${name}:`);
    console.log(`  ⏱️  Avg Response Time: ${avgTime}ms`);
    console.log(`  🧠 Avg Reasoning Tokens: ${avgReasoning}`);
    console.log(`  ⭐ Avg Quality Score: ${avgQuality}/5`);
    
    // Check specific scenario performance
    const complexQueries = testScenarios
      .map((s, i) => ({ ...s, score: data.qualityScores[i] }))
      .filter(s => s.needsReasoning === 'HIGH');
    const complexAvg = complexQueries.reduce((a, b) => a + b.score, 0) / complexQueries.length;
    
    console.log(`  🔧 Complex Query Score: ${complexAvg.toFixed(1)}/5`);
  }
  
  console.log('\n\n💡 RECOMMENDATION:');
  console.log('-'.repeat(40));
  
  // Calculate cost-benefit
  const lowData = results['LOW (Current)'];
  const mediumData = results['MEDIUM'];
  
  if (lowData && mediumData) {
    const qualityImprovement = ((mediumData.qualityScores.reduce((a,b) => a+b, 0) / mediumData.qualityScores.length) - 
                                (lowData.qualityScores.reduce((a,b) => a+b, 0) / lowData.qualityScores.length));
    const speedPenalty = ((mediumData.totalTime - lowData.totalTime) / lowData.totalTime * 100);
    
    console.log(`
Quality Improvement with MEDIUM: ${qualityImprovement > 0 ? '+' : ''}${qualityImprovement.toFixed(1)} points
Speed Penalty with MEDIUM: ${speedPenalty.toFixed(0)}% slower
Token Increase with MEDIUM: ${Math.round((mediumData.totalReasoning - lowData.totalReasoning) / lowData.totalReasoning * 100)}% more

VERDICT: ${qualityImprovement > 0.5 ? 
  'Consider MEDIUM reasoning for complex queries' : 
  'Stay with LOW reasoning - minimal quality gain'
}
    `);
  }
}

testOptimalReasoning().catch(console.error);