#!/usr/bin/env npx tsx
/**
 * Test chat API with proper conversation context
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testChatWithContext() {
  const baseUrl = 'http://localhost:3000';
  const sessionId = `test-context-${Date.now()}`;
  const conversationId = crypto.randomUUID();
  
  console.log('🔬 TESTING CHAT WITH CONVERSATION CONTEXT\n');
  console.log('='.repeat(80));
  console.log(`Conversation ID: ${conversationId}`);
  console.log(`Session ID: ${sessionId}\n`);
  
  try {
    // Step 1: Send first message about tipper
    console.log('📝 Step 1: Asking about tipper');
    console.log('-'.repeat(60));
    
    const firstResponse = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "I need to buy a tipper",
        conversation_id: conversationId,
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk'
      })
    });
    
    const firstResult = await firstResponse.json();
    console.log('Response:', firstResult.message.substring(0, 200) + '...\n');
    
    // Step 2: Send follow-up about agriculture
    console.log('📝 Step 2: Following up with "its for agriculture"');
    console.log('-'.repeat(60));
    
    // Wait a bit to ensure message is saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const secondResponse = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "its for agriculture",
        conversation_id: conversationId,
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk'
      })
    });
    
    const secondResult = await secondResponse.json();
    console.log('Response:', secondResult.message.substring(0, 500) + '...\n');
    
    // Check if Agri Flip is mentioned
    const mentionsAgriFlip = secondResult.message.toLowerCase().includes('agri flip') || 
                            secondResult.message.toLowerCase().includes('agri-flip');
    
    if (mentionsAgriFlip) {
      console.log('🎯 SUCCESS: Response mentions Agri Flip product!');
    } else {
      console.log('⚠️  FAIL: Response does not mention Agri Flip product');
    }
    
    // Step 3: Check what was stored in the database
    console.log('\n📊 Step 3: Checking conversation in database');
    console.log('-'.repeat(60));
    
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (messages && messages.length > 0) {
      console.log(`Found ${messages.length} messages in conversation:`);
      messages.forEach((msg, i) => {
        console.log(`  ${i + 1}. [${msg.role}]: "${msg.content.substring(0, 50)}..."`);
      });
    } else {
      console.log('⚠️  No messages found in database for this conversation');
    }
    
    // Clean up test conversation
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);
    
    await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST COMPLETE\n');
  console.log('Expected behavior:');
  console.log('- Second query should find Agri Flip by combining "tipper" + "agriculture"');
  console.log('- Query reformulation should detect the continuation pattern');
}

testChatWithContext().catch(console.error);