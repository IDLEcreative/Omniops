import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testGPT5Response() {
  console.log('\n🔍 Testing GPT-5-mini response structure...\n');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Test with the exact parameters we use in the API
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful customer service assistant. Keep responses concise.'
        },
        { 
          role: 'user', 
          content: 'What products do you sell?' 
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 500,
    });
    
    console.log('✅ Success with GPT-5-mini!');
    console.log('\nFull response object:');
    console.log(JSON.stringify(completion, null, 2));
    
    console.log('\n📝 Key fields:');
    console.log('Model:', completion.model);
    console.log('Message content:', completion.choices[0]?.message?.content);
    console.log('Finish reason:', completion.choices[0]?.finish_reason);
    console.log('Usage:', completion.usage);
    
    // Check if response structure is different
    if (completion.choices && completion.choices[0]) {
      const choice = completion.choices[0];
      console.log('\n🔎 Choice structure:');
      console.log('Keys in choice:', Object.keys(choice));
      console.log('Keys in message:', Object.keys(choice.message || {}));
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    // Log full error for debugging
    console.log('\nFull error object:', error);
  }
}

testGPT5Response().catch(console.error);