const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

async function testGPT5Mini() {
  console.log('\n🔍 Testing GPT-5-mini directly with OpenAI API...\n');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const models = ['gpt-5-mini', 'gpt-4o-mini', 'gpt-4-turbo-preview'];
  
  for (const model of models) {
    console.log(`\nTesting model: ${model}`);
    console.log('-'.repeat(50));
    
    try {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Keep responses brief.' },
          { role: 'user', content: 'Say hello and tell me what model you are.' }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });
      
      console.log('✅ Success!');
      console.log('Response:', completion.choices[0]?.message?.content);
      console.log('Model used:', completion.model);
      
    } catch (error) {
      console.log('❌ Error:', error.message);
      if (error.response) {
        console.log('API Error Details:', error.response.data || error.response.statusText);
      }
    }
  }
  
  console.log('\n📋 Available models check...');
  try {
    const models = await openai.models.list();
    const gptModels = models.data
      .filter(m => m.id.includes('gpt'))
      .map(m => m.id)
      .sort();
    console.log('GPT models available:', gptModels.slice(0, 10));
  } catch (error) {
    console.log('Could not list models:', error.message);
  }
}

testGPT5Mini().catch(console.error);