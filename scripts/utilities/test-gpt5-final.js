const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

async function testGPT5Final() {
  console.log('\n🔍 Testing GPT-5-mini with correct parameters...\n');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Test with NO temperature parameter (uses default of 1)
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful customer service assistant for a spare parts store. Keep responses concise.'
        },
        { 
          role: 'user', 
          content: 'What types of spare parts do you sell?' 
        }
      ],
      max_completion_tokens: 500,
    });
    
    console.log('✅ Success with GPT-5-mini!');
    console.log('\n📝 Response:');
    console.log('Model used:', completion.model);
    console.log('Content:', completion.choices[0]?.message?.content);
    console.log('\n📊 Token usage:', completion.usage);
    
    return true;
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.status) {
      console.log('Status:', error.status);
    }
    if (error.error) {
      console.log('Error details:', error.error);
    }
    return false;
  }
}

testGPT5Final()
  .then(success => {
    if (success) {
      console.log('\n✨ GPT-5-mini is working correctly!');
      console.log('The chat API should now be using GPT-5-mini.');
    } else {
      console.log('\n⚠️  There may still be an issue with GPT-5-mini.');
    }
  })
  .catch(console.error);