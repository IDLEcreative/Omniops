#!/usr/bin/env tsx
/**
 * Quick Conversation Flow Test
 * Focused test to evaluate conversation continuity and context retention
 */

import fetch from 'node-fetch';

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
}

class QuickConversationTest {
  private baseUrl = 'http://localhost:3000/api/chat';

  async sendMessage(
    message: string,
    conversationId: string | null = null,
    sessionId: string = 'quick-test',
    domain: string = 'thompsonseparts.co.uk'
  ): Promise<ChatResponse> {
    const payload: any = {
      message,
      session_id: sessionId,
      domain
    };
    
    if (conversationId) {
      payload.conversation_id = conversationId;
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as ChatResponse;
  }

  async runTest() {
    console.log('🚀 Quick Conversation Flow Test');
    console.log('===============================\n');

    let conversationId: string | null = null;
    const conversation: Array<{ input: string; output: string }> = [];

    // Test 1: Initial greeting and product inquiry
    console.log('📝 Test 1: Greeting and Product Inquiry');
    const msg1 = 'Hi, I need brake pads for my Honda Civic';
    console.log(`User: ${msg1}`);
    
    const response1 = await this.sendMessage(msg1, conversationId);
    conversationId = response1.conversation_id;
    conversation.push({ input: msg1, output: response1.message });
    console.log(`Agent: ${response1.message.substring(0, 150)}...`);
    console.log(`Conversation ID: ${conversationId}\n`);

    // Test 2: Follow-up with specific details
    console.log('📝 Test 2: Follow-up with Details');
    const msg2 = 'It\'s a 2018 Honda Civic Type R. I need front brake pads specifically.';
    console.log(`User: ${msg2}`);
    
    const response2 = await this.sendMessage(msg2, conversationId);
    conversation.push({ input: msg2, output: response2.message });
    console.log(`Agent: ${response2.message.substring(0, 150)}...`);

    // Check if agent remembered it's about Honda Civic
    const remembersHonda = response2.message.toLowerCase().includes('honda') || 
                          response2.message.toLowerCase().includes('civic');
    console.log(`✅ Context Check: Remembers Honda Civic: ${remembersHonda ? 'YES' : 'NO'}\n`);

    // Test 3: Topic change - brake problem
    console.log('📝 Test 3: Topic Change to Problem');
    const msg3 = 'Actually, my brake pedal feels spongy. What could cause this?';
    console.log(`User: ${msg3}`);
    
    const response3 = await this.sendMessage(msg3, conversationId);
    conversation.push({ input: msg3, output: response3.message });
    console.log(`Agent: ${response3.message.substring(0, 150)}...`);

    // Check if agent connects this to the brake pads discussion
    const connectsBrakes = response3.message.toLowerCase().includes('brake') &&
                          (response3.message.toLowerCase().includes('pad') ||
                           response3.message.toLowerCase().includes('fluid') ||
                           response3.message.toLowerCase().includes('system'));
    console.log(`✅ Context Check: Connects to brake discussion: ${connectsBrakes ? 'YES' : 'NO'}\n`);

    // Test 4: Clarification request
    console.log('📝 Test 4: Clarification and Memory Test');
    const msg4 = 'Going back to the brake pads - do you have them in stock for my car?';
    console.log(`User: ${msg4}`);
    
    const response4 = await this.sendMessage(msg4, conversationId);
    conversation.push({ input: msg4, output: response4.message });
    console.log(`Agent: ${response4.message.substring(0, 150)}...`);

    // Check if agent remembers the specific car model
    const remembersSpecificModel = response4.message.toLowerCase().includes('2018') ||
                                  response4.message.toLowerCase().includes('type r') ||
                                  (response4.message.toLowerCase().includes('honda') && 
                                   response4.message.toLowerCase().includes('civic'));
    console.log(`✅ Memory Check: Remembers 2018 Honda Civic Type R: ${remembersSpecificModel ? 'YES' : 'NO'}\n`);

    // Analysis
    console.log('📊 CONVERSATION ANALYSIS');
    console.log('========================');
    
    // Context Retention Score
    let contextScore = 0;
    if (remembersHonda) contextScore += 3;
    if (connectsBrakes) contextScore += 3;
    if (remembersSpecificModel) contextScore += 4;
    
    console.log(`Context Retention Score: ${contextScore}/10`);
    
    // Natural Flow Analysis
    let flowScore = 8; // Base score
    if (response2.message.length < 50) flowScore -= 2; // Too short responses
    if (response3.message.toLowerCase().includes("sorry") && response3.message.length < 100) flowScore -= 1;
    if (response4.message.toLowerCase().includes("don't know")) flowScore -= 3;
    
    console.log(`Natural Flow Score: ${Math.max(0, flowScore)}/10`);
    
    // Topic Handling Analysis
    let topicScore = 8; // Base score
    const topicShift = this.analyzeTopicShift(conversation);
    if (!topicShift.acknowledgedShift) topicScore -= 2;
    if (!topicShift.maintainedRelevance) topicScore -= 3;
    
    console.log(`Topic Handling Score: ${Math.max(0, topicScore)}/10`);
    
    // Detail Memory Analysis
    let memoryScore = 0;
    const detailsToRemember = ['Honda', 'Civic', '2018', 'Type R', 'front', 'brake pads'];
    const finalResponse = response4.message.toLowerCase();
    
    detailsToRemember.forEach(detail => {
      if (finalResponse.includes(detail.toLowerCase())) {
        memoryScore += 1.67; // 10/6 points per detail
      }
    });
    
    console.log(`Detail Memory Score: ${Math.round(memoryScore)}/10`);
    
    // Overall Assessment
    const overallScore = (contextScore + Math.max(0, flowScore) + Math.max(0, topicScore) + Math.round(memoryScore)) / 4;
    console.log(`\n🎯 OVERALL SCORE: ${overallScore.toFixed(1)}/10`);
    
    // Detailed Examples
    console.log('\n📝 DETAILED ANALYSIS:');
    console.log('=====================');
    
    console.log('\n✅ GOOD EXAMPLES:');
    if (remembersHonda) {
      console.log('• Agent successfully maintained context about Honda Civic across messages');
    }
    if (connectsBrakes) {
      console.log('• Agent connected spongy brake pedal issue to ongoing brake discussion');
    }
    if (remembersSpecificModel) {
      console.log('• Agent remembered specific vehicle details (2018 Honda Civic Type R)');
    }
    
    console.log('\n❌ AREAS FOR IMPROVEMENT:');
    if (!remembersHonda) {
      console.log('• Agent failed to maintain context about vehicle make/model');
    }
    if (!connectsBrakes) {
      console.log('• Agent didn\'t connect brake problem to previous brake pad discussion');
    }
    if (!remembersSpecificModel) {
      console.log('• Agent lost specific vehicle details during conversation');
    }
    if (flowScore < 7) {
      console.log('• Conversation flow could be more natural and comprehensive');
    }
    
    console.log('\n🔍 RESPONSE QUALITY INSIGHTS:');
    console.log('============================');
    conversation.forEach((turn, index) => {
      console.log(`\nTurn ${index + 1}:`);
      console.log(`Input: "${turn.input}"`);
      console.log(`Output length: ${turn.output.length} characters`);
      console.log(`Contains apology: ${turn.output.toLowerCase().includes('sorry') ? 'Yes' : 'No'}`);
      console.log(`Contains uncertainty: ${turn.output.toLowerCase().includes("don't know") || turn.output.toLowerCase().includes("not sure") ? 'Yes' : 'No'}`);
    });
    
    return {
      contextRetention: contextScore,
      naturalFlow: Math.max(0, flowScore),
      topicHandling: Math.max(0, topicScore),
      memoryOfDetails: Math.round(memoryScore),
      overall: overallScore,
      conversation
    };
  }
  
  private analyzeTopicShift(conversation: Array<{ input: string; output: string }>): { 
    acknowledgedShift: boolean; 
    maintainedRelevance: boolean; 
  } {
    // Look at the transition from brake pads to brake pedal problem
    const thirdResponse = conversation[2]?.output.toLowerCase() || '';
    
    // Check if agent acknowledged the topic shift
    const acknowledgedShift = thirdResponse.includes('spongy') || 
                             thirdResponse.includes('pedal') ||
                             thirdResponse.includes('understand') ||
                             thirdResponse.includes('different') ||
                             thirdResponse.includes('issue');
    
    // Check if agent maintained relevance to brakes
    const maintainedRelevance = thirdResponse.includes('brake') &&
                               (thirdResponse.includes('system') || 
                                thirdResponse.includes('fluid') ||
                                thirdResponse.includes('pad') ||
                                thirdResponse.includes('component'));
    
    return { acknowledgedShift, maintainedRelevance };
  }
}

async function main() {
  const tester = new QuickConversationTest();
  
  try {
    const results = await tester.runTest();
    
    console.log('\n🏁 TEST COMPLETE');
    console.log('================');
    console.log(`Final Assessment: ${results.overall >= 8 ? 'EXCELLENT' : results.overall >= 6 ? 'GOOD' : results.overall >= 4 ? 'NEEDS IMPROVEMENT' : 'POOR'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}