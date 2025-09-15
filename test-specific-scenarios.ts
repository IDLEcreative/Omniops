#!/usr/bin/env tsx
/**
 * Specific Conversation Scenario Tests
 */

import fetch from 'node-fetch';

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{ url: string; title: string; relevance: number; }>;
}

class SpecificScenarioTest {
  private baseUrl = 'http://localhost:3000/api/chat';

  async sendMessage(message: string, conversationId: string | null = null, sessionId: string = 'scenario-test'): Promise<ChatResponse> {
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

  async testTechnicalProgression() {
    console.log('🔧 Technical Discussion Progression Test');
    console.log('========================================\n');

    let conversationId: string | null = null;
    const messages = [
      'My truck engine is making a weird noise',
      'It\'s a rattling sound when I accelerate, especially uphill',
      'Wait, it only rattles when the engine is cold, not when warm',
      'Could this be timing chain related?'
    ];

    let contextScore = 0;
    let clarificationHandling = 0;

    for (let i = 0; i < messages.length; i++) {
      console.log(`Message ${i + 1}: ${messages[i]}`);
      const response = await this.sendMessage(messages[i], conversationId);
      conversationId = response.conversation_id;
      
      console.log(`Response: ${response.message.substring(0, 120)}...`);
      
      // Analyze response quality
      if (i > 0) {
        const prevContext = messages.slice(0, i).join(' ').toLowerCase();
        const responseText = response.message.toLowerCase();
        
        // Check for context retention
        if ((prevContext.includes('engine') && responseText.includes('engine')) ||
            (prevContext.includes('noise') && responseText.includes('noise')) ||
            (prevContext.includes('rattle') && responseText.includes('rattle'))) {
          contextScore++;
          console.log('✅ Maintains context from previous messages');
        }
        
        // Check clarification handling (message 3 is a clarification)
        if (i === 2) {
          if (responseText.includes('cold') || responseText.includes('warm') || 
              responseText.includes('temperature') || responseText.includes('specific')) {
            clarificationHandling++;
            console.log('✅ Acknowledges and incorporates clarification');
          }
        }
      }
      
      console.log('');
    }

    return { contextScore, clarificationHandling, totalMessages: messages.length };
  }

  async testOrderToComplaintEvolution() {
    console.log('📦 Order Inquiry to Complaint Evolution Test');
    console.log('============================================\n');

    let conversationId: string | null = null;
    const messages = [
      'Can you help me track my order TS-2024-001234?',
      'I ordered it last week and was told it would arrive Friday',
      'It\'s now Monday and still no delivery. This is frustrating.',
      'I need this urgently for my business. What compensation can you offer?'
    ];

    let emotionalHandling = 0;
    let orderContextRetention = 0;
    let escalationHandling = 0;

    for (let i = 0; i < messages.length; i++) {
      console.log(`Message ${i + 1}: ${messages[i]}`);
      const response = await this.sendMessage(messages[i], conversationId);
      conversationId = response.conversation_id;
      
      console.log(`Response: ${response.message.substring(0, 120)}...`);
      
      const responseText = response.message.toLowerCase();
      
      // Check order number retention
      if (responseText.includes('ts-2024-001234') || 
          (i > 0 && responseText.includes('order') && responseText.includes('track'))) {
        orderContextRetention++;
        console.log('✅ Retains order context');
      }
      
      // Check emotional handling (messages 3-4 show frustration)
      if (i >= 2) {
        if (responseText.includes('sorry') || responseText.includes('understand') ||
            responseText.includes('apologize') || responseText.includes('frustrating')) {
          emotionalHandling++;
          console.log('✅ Acknowledges customer emotion appropriately');
        }
      }
      
      // Check escalation handling (message 4)
      if (i === 3) {
        if (responseText.includes('compensation') || responseText.includes('resolution') ||
            responseText.includes('manager') || responseText.includes('escalate')) {
          escalationHandling++;
          console.log('✅ Addresses escalation request');
        }
      }
      
      console.log('');
    }

    return { emotionalHandling, orderContextRetention, escalationHandling, totalMessages: messages.length };
  }

  async testTopicChangeHandling() {
    console.log('🔄 Topic Change and Interruption Test');
    console.log('====================================\n');

    let conversationId: string | null = null;
    const messages = [
      'I need oil filters for a BMW 320d',
      'Actually, before that, I also need wiper blades for the same car',
      'Sorry, going back to oil filters - do you have genuine BMW ones?',
      'And about those wiper blades - can you check both items availability?'
    ];

    let topicSwitchHandling = 0;
    let multipleItemTracking = 0;
    let returnToTopicHandling = 0;

    for (let i = 0; i < messages.length; i++) {
      console.log(`Message ${i + 1}: ${messages[i]}`);
      const response = await this.sendMessage(messages[i], conversationId);
      conversationId = response.conversation_id;
      
      console.log(`Response: ${response.message.substring(0, 120)}...`);
      
      const responseText = response.message.toLowerCase();
      
      // Check topic switch acknowledgment (message 2)
      if (i === 1) {
        if (responseText.includes('wiper') && responseText.includes('blade') &&
            (responseText.includes('also') || responseText.includes('addition') || 
             responseText.includes('well') || responseText.includes('both'))) {
          topicSwitchHandling++;
          console.log('✅ Acknowledges topic addition smoothly');
        }
      }
      
      // Check return to original topic (message 3)
      if (i === 2) {
        if (responseText.includes('oil') && responseText.includes('filter') &&
            (responseText.includes('back') || responseText.includes('original') || 
             responseText.includes('returning'))) {
          returnToTopicHandling++;
          console.log('✅ Handles return to original topic');
        }
      }
      
      // Check multiple item tracking (message 4)
      if (i === 3) {
        if (responseText.includes('oil') && responseText.includes('wiper') &&
            (responseText.includes('both') || responseText.includes('items'))) {
          multipleItemTracking++;
          console.log('✅ Tracks multiple items simultaneously');
        }
      }
      
      console.log('');
    }

    return { topicSwitchHandling, returnToTopicHandling, multipleItemTracking };
  }

  async runAllScenarios() {
    console.log('🎯 COMPREHENSIVE SCENARIO-BASED CONVERSATION TEST');
    console.log('================================================\n');

    const technicalResults = await this.testTechnicalProgression();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause between tests
    
    const orderResults = await this.testOrderToComplaintEvolution();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const topicResults = await this.testTopicChangeHandling();

    // Generate comprehensive report
    console.log('📊 COMPREHENSIVE ANALYSIS REPORT');
    console.log('================================\n');

    console.log('🔧 TECHNICAL DISCUSSION RESULTS:');
    console.log(`Context Retention: ${technicalResults.contextScore}/${technicalResults.totalMessages - 1} (${((technicalResults.contextScore/(technicalResults.totalMessages - 1)) * 10).toFixed(1)}/10)`);
    console.log(`Clarification Handling: ${technicalResults.clarificationHandling}/1 (${technicalResults.clarificationHandling * 10}/10)`);

    console.log('\n📦 ORDER-TO-COMPLAINT RESULTS:');
    console.log(`Emotional Handling: ${orderResults.emotionalHandling}/2 (${(orderResults.emotionalHandling/2 * 10).toFixed(1)}/10)`);
    console.log(`Order Context Retention: ${orderResults.orderContextRetention}/${orderResults.totalMessages} (${(orderResults.orderContextRetention/orderResults.totalMessages * 10).toFixed(1)}/10)`);
    console.log(`Escalation Handling: ${orderResults.escalationHandling}/1 (${orderResults.escalationHandling * 10}/10)`);

    console.log('\n🔄 TOPIC CHANGE RESULTS:');
    console.log(`Topic Switch Handling: ${topicResults.topicSwitchHandling}/1 (${topicResults.topicSwitchHandling * 10}/10)`);
    console.log(`Return to Topic: ${topicResults.returnToTopicHandling}/1 (${topicResults.returnToTopicHandling * 10}/10)`);
    console.log(`Multiple Item Tracking: ${topicResults.multipleItemTracking}/1 (${topicResults.multipleItemTracking * 10}/10)`);

    // Calculate overall scores
    const contextScore = ((technicalResults.contextScore/(technicalResults.totalMessages - 1)) * 10 + 
                         (orderResults.orderContextRetention/orderResults.totalMessages * 10)) / 2;
    
    const naturalFlowScore = (technicalResults.clarificationHandling * 10 + 
                             orderResults.emotionalHandling/2 * 10 +
                             topicResults.topicSwitchHandling * 10) / 3;
    
    const topicHandlingScore = (topicResults.topicSwitchHandling * 10 + 
                               topicResults.returnToTopicHandling * 10 +
                               topicResults.multipleItemTracking * 10) / 3;
    
    const memoryScore = contextScore; // Context retention is a form of memory

    console.log('\n🎯 FINAL SCORES:');
    console.log('================');
    console.log(`Context Retention: ${contextScore.toFixed(1)}/10`);
    console.log(`Natural Flow: ${naturalFlowScore.toFixed(1)}/10`);
    console.log(`Topic Handling: ${topicHandlingScore.toFixed(1)}/10`);
    console.log(`Memory of Details: ${memoryScore.toFixed(1)}/10`);
    
    const overallScore = (contextScore + naturalFlowScore + topicHandlingScore + memoryScore) / 4;
    console.log(`\n🏆 OVERALL SCORE: ${overallScore.toFixed(1)}/10`);
    
    console.log('\n📝 KEY FINDINGS:');
    console.log('================');
    
    if (contextScore >= 8) {
      console.log('✅ STRENGTH: Excellent context retention across conversations');
    } else if (contextScore >= 6) {
      console.log('⚠️  MODERATE: Good context retention with room for improvement');
    } else {
      console.log('❌ WEAKNESS: Context retention needs significant improvement');
    }
    
    if (naturalFlowScore >= 8) {
      console.log('✅ STRENGTH: Natural conversation flow and emotional handling');
    } else if (naturalFlowScore >= 6) {
      console.log('⚠️  MODERATE: Adequate flow with some awkward transitions');
    } else {
      console.log('❌ WEAKNESS: Conversation flow feels unnatural or robotic');
    }
    
    if (topicHandlingScore >= 8) {
      console.log('✅ STRENGTH: Excellent at managing topic changes and interruptions');
    } else if (topicHandlingScore >= 6) {
      console.log('⚠️  MODERATE: Handles topic changes but could be smoother');
    } else {
      console.log('❌ WEAKNESS: Struggles with topic changes and multiple subjects');
    }

    console.log('\n🚀 RECOMMENDATIONS:');
    console.log('===================');
    
    if (contextScore < 7) {
      console.log('• Improve conversation memory by better storing and referencing previous discussion points');
    }
    if (naturalFlowScore < 7) {
      console.log('• Enhance emotional intelligence and acknowledgment of customer sentiment');
    }
    if (topicHandlingScore < 7) {
      console.log('• Better handle topic switches with explicit acknowledgments and smooth transitions');
    }
    if (overallScore < 6) {
      console.log('• Consider implementing conversation state management to track ongoing discussions');
    }

    return {
      contextRetention: contextScore,
      naturalFlow: naturalFlowScore,
      topicHandling: topicHandlingScore,
      memoryOfDetails: memoryScore,
      overall: overallScore
    };
  }
}

async function main() {
  const tester = new SpecificScenarioTest();
  
  try {
    const results = await tester.runAllScenarios();
    
    console.log(`\n🎯 FINAL ASSESSMENT: ${results.overall >= 8 ? 'EXCELLENT' : results.overall >= 6 ? 'GOOD' : results.overall >= 4 ? 'NEEDS IMPROVEMENT' : 'POOR'}`);
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}