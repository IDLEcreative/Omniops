#!/usr/bin/env tsx
/**
 * Price Negotiation and Long-term Memory Test
 */

import fetch from 'node-fetch';

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{ url: string; title: string; relevance: number; }>;
}

class NegotiationMemoryTest {
  private baseUrl = 'http://localhost:3000/api/chat';

  async sendMessage(message: string, conversationId: string | null = null, sessionId: string = 'nego-test'): Promise<ChatResponse> {
    const payload: any = {
      message,
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk'
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

  async testPriceNegotiation() {
    console.log('💰 Price Negotiation and Customer History Test');
    console.log('==============================================\n');

    let conversationId: string | null = null;
    const conversation: Array<{input: string; output: string; analysis: string}> = [];

    // Message 1: Initial inquiry
    const msg1 = 'I\'m looking for brake discs for a Ford Focus. What\'s your best price?';
    console.log(`User: ${msg1}`);
    const resp1 = await this.sendMessage(msg1, conversationId);
    conversationId = resp1.conversation_id;
    console.log(`Agent: ${resp1.message.substring(0, 100)}...`);
    
    let analysis1 = '';
    if (resp1.message.toLowerCase().includes('price') || resp1.message.toLowerCase().includes('cost')) {
      analysis1 = '✅ Acknowledges price inquiry';
    } else {
      analysis1 = '❌ Doesn\'t acknowledge price focus';
    }
    console.log(analysis1);
    conversation.push({input: msg1, output: resp1.message, analysis: analysis1});

    // Message 2: Price comparison
    await new Promise(resolve => setTimeout(resolve, 1000));
    const msg2 = 'That seems expensive. I found them for £30 less elsewhere.';
    console.log(`\nUser: ${msg2}`);
    const resp2 = await this.sendMessage(msg2, conversationId);
    console.log(`Agent: ${resp2.message.substring(0, 100)}...`);
    
    let analysis2 = '';
    if (resp2.message.toLowerCase().includes('competitive') || resp2.message.toLowerCase().includes('match') || 
        resp2.message.toLowerCase().includes('compare') || resp2.message.toLowerCase().includes('price')) {
      analysis2 = '✅ Acknowledges price comparison';
    } else {
      analysis2 = '❌ Doesn\'t address price concern';
    }
    console.log(analysis2);
    conversation.push({input: msg2, output: resp2.message, analysis: analysis2});

    // Message 3: Customer history mention
    await new Promise(resolve => setTimeout(resolve, 1000));
    const msg3 = 'I\'ve been a customer for 3 years and spent over £2000 with you.';
    console.log(`\nUser: ${msg3}`);
    const resp3 = await this.sendMessage(msg3, conversationId);
    console.log(`Agent: ${resp3.message.substring(0, 100)}...`);
    
    let analysis3 = '';
    if (resp3.message.toLowerCase().includes('customer') || resp3.message.toLowerCase().includes('loyalty') || 
        resp3.message.toLowerCase().includes('appreciate') || resp3.message.toLowerCase().includes('valued')) {
      analysis3 = '✅ Acknowledges customer loyalty';
    } else {
      analysis3 = '❌ Doesn\'t recognize loyalty value';
    }
    console.log(analysis3);
    conversation.push({input: msg3, output: resp3.message, analysis: analysis3});

    // Message 4: Package deal
    await new Promise(resolve => setTimeout(resolve, 1000));
    const msg4 = 'What if I buy brake pads too? Would you give me a package deal?';
    console.log(`\nUser: ${msg4}`);
    const resp4 = await this.sendMessage(msg4, conversationId);
    console.log(`Agent: ${resp4.message.substring(0, 100)}...`);
    
    let analysis4 = '';
    const hasDisc = resp4.message.toLowerCase().includes('disc') || resp4.message.toLowerCase().includes('brake');
    const hasPads = resp4.message.toLowerCase().includes('pad');
    const hasPackage = resp4.message.toLowerCase().includes('package') || resp4.message.toLowerCase().includes('deal') || 
                      resp4.message.toLowerCase().includes('bundle') || resp4.message.toLowerCase().includes('together');
    
    if (hasDisc && hasPads && hasPackage) {
      analysis4 = '✅ Remembers discs + acknowledges pads + package concept';
    } else if (hasPackage || (hasDisc && hasPads)) {
      analysis4 = '⚠️  Partial acknowledgment of package deal';
    } else {
      analysis4 = '❌ Doesn\'t connect to ongoing negotiation';
    }
    console.log(analysis4);
    conversation.push({input: msg4, output: resp4.message, analysis: analysis4});

    // Message 5: Memory test - going back to customer history
    await new Promise(resolve => setTimeout(resolve, 1000));
    const msg5 = 'Can you check my purchase history to see what I\'ve bought?';
    console.log(`\nUser: ${msg5}`);
    const resp5 = await this.sendMessage(msg5, conversationId);
    console.log(`Agent: ${resp5.message.substring(0, 100)}...`);
    
    let analysis5 = '';
    if (resp5.message.toLowerCase().includes('3 year') || resp5.message.toLowerCase().includes('£2000') || 
        resp5.message.toLowerCase().includes('history') || resp5.message.toLowerCase().includes('previous')) {
      analysis5 = '✅ Remembers previously mentioned history details';
    } else if (resp5.message.toLowerCase().includes('customer') || resp5.message.toLowerCase().includes('account')) {
      analysis5 = '⚠️  Acknowledges need but doesn\'t recall specifics';
    } else {
      analysis5 = '❌ No memory of previous conversation';
    }
    console.log(analysis5);
    conversation.push({input: msg5, output: resp5.message, analysis: analysis5});

    return conversation;
  }

  async runMemoryTest() {
    console.log('\n🧠 CONVERSATION MEMORY & NEGOTIATION ANALYSIS');
    console.log('=============================================\n');

    const conversation = await this.testPriceNegotiation();

    // Score the conversation
    let priceHandlingScore = 0;
    let loyaltyRecognitionScore = 0;
    let memoryScore = 0;
    let negotiationFlowScore = 0;

    conversation.forEach((turn, index) => {
      const analysis = turn.analysis;
      
      if (index === 0 || index === 1) { // Price handling
        if (analysis.includes('✅')) priceHandlingScore += 5;
        else if (analysis.includes('⚠️')) priceHandlingScore += 2;
      }
      
      if (index === 2) { // Loyalty recognition
        if (analysis.includes('✅')) loyaltyRecognitionScore = 10;
        else if (analysis.includes('⚠️')) loyaltyRecognitionScore = 5;
      }
      
      if (index === 3 || index === 4) { // Memory and flow
        if (analysis.includes('✅')) memoryScore += 5;
        else if (analysis.includes('⚠️')) memoryScore += 2;
      }
    });

    // Negotiation flow assessment
    const responses = conversation.map(c => c.output.toLowerCase());
    if (responses.some(r => r.includes('competitive') || r.includes('match'))) negotiationFlowScore += 3;
    if (responses.some(r => r.includes('loyalty') || r.includes('valued'))) negotiationFlowScore += 3;
    if (responses.some(r => r.includes('package') || r.includes('deal'))) negotiationFlowScore += 4;

    console.log('📊 DETAILED SCORING:');
    console.log('====================');
    console.log(`Price Handling: ${priceHandlingScore}/10`);
    console.log(`Loyalty Recognition: ${loyaltyRecognitionScore}/10`);
    console.log(`Memory Retention: ${memoryScore}/10`);
    console.log(`Negotiation Flow: ${negotiationFlowScore}/10`);

    const overallScore = (priceHandlingScore + loyaltyRecognitionScore + memoryScore + negotiationFlowScore) / 4;
    console.log(`\n🎯 OVERALL NEGOTIATION SCORE: ${overallScore.toFixed(1)}/10`);

    console.log('\n📝 CONVERSATION BREAKDOWN:');
    console.log('==========================');
    conversation.forEach((turn, index) => {
      console.log(`\nTurn ${index + 1}:`);
      console.log(`Input: "${turn.input}"`);
      console.log(`Analysis: ${turn.analysis}`);
      console.log(`Response Quality: ${turn.output.length} chars, ${turn.output.toLowerCase().includes('sorry') ? 'apologetic' : 'direct'} tone`);
    });

    console.log('\n🔍 KEY INSIGHTS:');
    console.log('================');
    
    if (priceHandlingScore >= 8) {
      console.log('✅ STRENGTH: Good at handling price discussions and comparisons');
    } else {
      console.log('❌ WEAKNESS: Needs improvement in price negotiation handling');
    }
    
    if (loyaltyRecognitionScore >= 8) {
      console.log('✅ STRENGTH: Recognizes and values customer loyalty');
    } else {
      console.log('❌ WEAKNESS: Doesn\'t leverage customer history effectively');
    }
    
    if (memoryScore >= 8) {
      console.log('✅ STRENGTH: Maintains good memory of conversation details');
    } else {
      console.log('❌ WEAKNESS: Poor memory retention across longer conversations');
    }
    
    if (negotiationFlowScore >= 8) {
      console.log('✅ STRENGTH: Natural negotiation conversation flow');
    } else {
      console.log('❌ WEAKNESS: Awkward or incomplete negotiation responses');
    }

    return {
      priceHandling: priceHandlingScore,
      loyaltyRecognition: loyaltyRecognitionScore,
      memoryRetention: memoryScore,
      negotiationFlow: negotiationFlowScore,
      overall: overallScore
    };
  }
}

async function main() {
  const tester = new NegotiationMemoryTest();
  
  try {
    const results = await tester.runMemoryTest();
    
    console.log(`\n🏆 FINAL NEGOTIATION ASSESSMENT: ${results.overall >= 8 ? 'EXCELLENT' : results.overall >= 6 ? 'GOOD' : results.overall >= 4 ? 'NEEDS IMPROVEMENT' : 'POOR'}`);
    console.log('===========================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}