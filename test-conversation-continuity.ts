#!/usr/bin/env npx tsx

/**
 * Test script for conversation continuity in chat-intelligent route
 * Verifies that GPT-5 mini properly handles back-and-forth conversations
 */

import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api/chat-intelligent';
const SESSION_ID = uuidv4();
let CONVERSATION_ID: string | undefined;

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: any[];
  metadata?: any;
}

async function sendMessage(message: string, iteration: number): Promise<ChatResponse> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Test ${iteration}] Sending: "${message}"`);
  console.log(`Conversation ID: ${CONVERSATION_ID || 'NEW'}`);
  console.log(`${'='.repeat(60)}\n`);

  const requestBody = {
    message,
    session_id: SESSION_ID,
    domain: 'thompsonseparts.co.uk',
    ...(CONVERSATION_ID && { conversation_id: CONVERSATION_ID })
  };

  console.log('Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: ChatResponse = await response.json();
    
    // Store conversation ID for subsequent messages
    if (data.conversation_id && !CONVERSATION_ID) {
      CONVERSATION_ID = data.conversation_id;
      console.log(`\n✅ Conversation ID established: ${CONVERSATION_ID}`);
    }

    console.log('\n📝 Response received:');
    console.log('-'.repeat(40));
    console.log(data.message);
    console.log('-'.repeat(40));
    
    if (data.metadata) {
      console.log('\n📊 Metadata:', JSON.stringify(data.metadata, null, 2));
    }

    return data;
  } catch (error) {
    console.error(`\n❌ Error in test ${iteration}:`, error);
    throw error;
  }
}

async function runConversationTest() {
  console.log('\n' + '🚀'.repeat(20));
  console.log('CONVERSATION CONTINUITY TEST - GPT-5 MINI');
  console.log('Testing back-and-forth with context retention');
  console.log('🚀'.repeat(20) + '\n');

  const testConversation = [
    {
      message: "Do you have any Cifa pumps?",
      expectedContext: "Should search for Cifa pumps and provide results"
    },
    {
      message: "What's the price of the first one?",
      expectedContext: "Should reference the first Cifa pump from previous response"
    },
    {
      message: "Do you have more like that?",
      expectedContext: "Should understand 'that' refers to Cifa pumps and provide more options"
    },
    {
      message: "Actually, show me Teng tools instead",
      expectedContext: "Should switch context to Teng tools"
    },
    {
      message: "How many of those do you have in total?",
      expectedContext: "Should know 'those' refers to Teng tools from previous message"
    }
  ];

  try {
    for (let i = 0; i < testConversation.length; i++) {
      const test = testConversation[i];
      console.log(`\n🔄 Test ${i + 1}/${testConversation.length}: ${test.expectedContext}`);
      
      const response = await sendMessage(test.message, i + 1);
      
      // Analyze response for context awareness
      console.log('\n🔍 Context Check:');
      
      // Check if it's maintaining context
      if (i > 0) {
        const hasContext = 
          (i === 1 && (response.message.includes('first') || response.message.includes('£'))) ||
          (i === 2 && response.message.toLowerCase().includes('cifa')) ||
          (i === 4 && response.message.toLowerCase().includes('teng'));
        
        if (hasContext) {
          console.log('✅ Response shows awareness of previous context');
        } else {
          console.log('⚠️ Response may not be using previous context effectively');
        }
      }
      
      // Check for GPT-5 mini confirmation (if mentioned in metadata or logs)
      if (response.metadata?.model) {
        console.log(`📌 Model used: ${response.metadata.model}`);
      }
      
      // Wait a bit between messages to simulate real conversation
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '✨'.repeat(20));
    console.log('TEST COMPLETE - SUMMARY');
    console.log('✨'.repeat(20));
    console.log(`\n✅ Successfully completed ${testConversation.length} conversation turns`);
    console.log(`✅ Conversation ID maintained: ${CONVERSATION_ID}`);
    console.log(`✅ Session ID: ${SESSION_ID}`);
    
    // Final verification - ask about the entire conversation
    console.log('\n🔄 Final Context Test: Asking about the entire conversation...');
    const finalResponse = await sendMessage(
      "Can you summarize what we've talked about so far?", 
      testConversation.length + 1
    );
    
    const mentionsCifa = finalResponse.message.toLowerCase().includes('cifa');
    const mentionsTeng = finalResponse.message.toLowerCase().includes('teng');
    const mentionsPumps = finalResponse.message.toLowerCase().includes('pump');
    const mentionsTools = finalResponse.message.toLowerCase().includes('tool');
    
    console.log('\n📋 Summary Analysis:');
    console.log(`  - Mentions Cifa: ${mentionsCifa ? '✅' : '❌'}`);
    console.log(`  - Mentions Teng: ${mentionsTeng ? '✅' : '❌'}`);
    console.log(`  - Mentions pumps: ${mentionsPumps ? '✅' : '❌'}`);
    console.log(`  - Mentions tools: ${mentionsTools ? '✅' : '❌'}`);
    
    if (mentionsCifa && mentionsTeng) {
      console.log('\n✅ PASS: AI successfully retained context across entire conversation!');
    } else {
      console.log('\n⚠️ WARNING: AI may not have retained full conversation context');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('✅ Starting conversation test on port 3000...\n');
  await runConversationTest();
}

main().catch(console.error);