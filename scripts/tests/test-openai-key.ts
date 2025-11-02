#!/usr/bin/env npx tsx

/**
 * Test OpenAI API key directly
 */

import OpenAI from 'openai';

async function testOpenAIKey() {
  console.log('🔑 Testing OpenAI API Key...\n');

  // Check if key exists
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    return;
  }

  console.log('✅ API Key found');
  console.log(`   Key format: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`   Key length: ${apiKey.length} characters\n`);

  // Test the key with a simple completion
  console.log('📡 Testing API connection...');

  try {
    const openai = new OpenAI({
      apiKey: apiKey
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "API key is working" if you can respond.' }
      ],
      max_tokens: 20
    });

    console.log('✅ OpenAI API Response:', completion.choices[0].message.content);
    console.log('\n📊 API Details:');
    console.log('   Model used:', completion.model);
    console.log('   Usage:', completion.usage);

    // Test embedding generation (what the chat uses)
    console.log('\n🔍 Testing embedding generation...');
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'test query'
    });

    console.log('✅ Embedding generated successfully');
    console.log('   Dimensions:', embedding.data[0].embedding.length);
    console.log('   Model:', embedding.model);

  } catch (error: any) {
    console.error('\n❌ OpenAI API Error:', error.message);

    if (error.status) {
      console.error('   Status:', error.status);
      console.error('   Type:', error.type);
    }

    if (error.message?.includes('401')) {
      console.error('\n🔒 Authentication failed - API key is invalid or expired');
    } else if (error.message?.includes('429')) {
      console.error('\n⚠️ Rate limit exceeded - too many requests');
    } else if (error.message?.includes('insufficient_quota')) {
      console.error('\n💳 Quota exceeded - OpenAI account needs billing update');
    }
  }
}

// Load env file
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

testOpenAIKey().catch(console.error);