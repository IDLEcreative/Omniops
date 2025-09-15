#!/usr/bin/env tsx
/**
 * Comprehensive Conversation Flow & Context Retention Test Suite
 * 
 * This test suite evaluates:
 * 1. Multi-turn conversation continuity
 * 2. Context retention across messages
 * 3. Topic change handling
 * 4. Customer detail memory
 * 5. Interruption and clarification handling
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
}

interface TestResult {
  scenario: string;
  messages: Array<{
    input: string;
    output: string;
    responseTime: number;
  }>;
  scores: {
    contextRetention: number;
    naturalFlow: number;
    topicHandling: number;
    memoryOfDetails: number;
  };
  analysis: string;
  examples: {
    good: string[];
    bad: string[];
  };
}

class ConversationTester {
  private baseUrl = 'http://localhost:3000/api/chat';
  private testResults: TestResult[] = [];
  private conversationCounter = 0;

  async sendMessage(
    message: string,
    conversationId: string | null = null,
    sessionId: string,
    domain: string = 'thompsonseparts.co.uk'
  ): Promise<{ response: ChatResponse; responseTime: number }> {
    const startTime = performance.now();
    
    const payload: any = {
      message,
      session_id: sessionId,
      domain
    };
    
    if (conversationId) {
      payload.conversation_id = conversationId;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as ChatResponse;
      const responseTime = performance.now() - startTime;

      return { response: data, responseTime };
    } catch (error) {
      console.error(`Error sending message: ${error}`);
      throw error;
    }
  }

  async runConversation(
    scenarioName: string,
    messages: string[],
    sessionId: string
  ): Promise<TestResult> {
    console.log(`\n🔄 Running scenario: ${scenarioName}`);
    
    let conversationId: string | null = null;
    const conversationLog: Array<{
      input: string;
      output: string;
      responseTime: number;
    }> = [];

    // Execute conversation turn by turn
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`   Message ${i + 1}: "${message}"`);
      
      try {
        const { response, responseTime } = await this.sendMessage(
          message,
          conversationId,
          sessionId
        );
        
        conversationId = response.conversation_id;
        
        conversationLog.push({
          input: message,
          output: response.message || 'NO_RESPONSE',
          responseTime
        });

        console.log(`   Response: "${response.message ? response.message.substring(0, 100) : 'NO_RESPONSE'}..."`);
        console.log(`   Time: ${responseTime.toFixed(2)}ms`);
        
        // Add delay between messages to simulate real conversation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Error in message ${i + 1}:`, error);
        conversationLog.push({
          input: message,
          output: `ERROR: ${error}`,
          responseTime: 0
        });
      }
    }

    // Analyze the conversation
    const analysis = this.analyzeConversation(conversationLog);
    
    const testResult: TestResult = {
      scenario: scenarioName,
      messages: conversationLog,
      scores: analysis.scores,
      analysis: analysis.summary,
      examples: analysis.examples
    };

    this.testResults.push(testResult);
    return testResult;
  }

  private analyzeConversation(conversationLog: Array<{
    input: string;
    output: string;
    responseTime: number;
  }>): {
    scores: { contextRetention: number; naturalFlow: number; topicHandling: number; memoryOfDetails: number };
    summary: string;
    examples: { good: string[]; bad: string[] };
  } {
    let contextRetention = 0;
    let naturalFlow = 0;
    let topicHandling = 0;
    let memoryOfDetails = 0;
    
    const goodExamples: string[] = [];
    const badExamples: string[] = [];

    // Analyze context retention
    for (let i = 1; i < conversationLog.length; i++) {
      const prevMessages = conversationLog.slice(0, i);
      const currentResponse = conversationLog[i].output;
      
      // Check if response references previous context
      const hasContextReferences = this.checkContextReferences(prevMessages, currentResponse);
      if (hasContextReferences.score > 0) {
        contextRetention += hasContextReferences.score;
        goodExamples.push(`Context retention: ${hasContextReferences.example}`);
      } else {
        badExamples.push(`Missing context: Response "${currentResponse.substring(0, 50)}..." didn't reference relevant previous information`);
      }
    }

    // Analyze natural flow
    for (let i = 1; i < conversationLog.length; i++) {
      const prevInput = conversationLog[i - 1].input;
      const prevOutput = conversationLog[i - 1].output;
      const currentInput = conversationLog[i].input;
      const currentOutput = conversationLog[i].output;
      
      const flowScore = this.assessNaturalFlow(prevInput, prevOutput, currentInput, currentOutput);
      naturalFlow += flowScore.score;
      
      if (flowScore.score >= 7) {
        goodExamples.push(`Natural flow: ${flowScore.example}`);
      } else if (flowScore.score <= 4) {
        badExamples.push(`Poor flow: ${flowScore.example}`);
      }
    }

    // Analyze topic handling
    const topics = this.extractTopics(conversationLog);
    if (topics.length > 1) {
      topicHandling = this.assessTopicHandling(conversationLog, topics);
    } else {
      topicHandling = 8; // Single topic is easy to handle
    }

    // Analyze memory of details
    const detailMemory = this.assessDetailMemory(conversationLog);
    memoryOfDetails = detailMemory.score;
    if (detailMemory.examples.good.length > 0) {
      goodExamples.push(...detailMemory.examples.good);
    }
    if (detailMemory.examples.bad.length > 0) {
      badExamples.push(...detailMemory.examples.bad);
    }

    // Normalize scores (0-10)
    const messageCount = conversationLog.length;
    contextRetention = Math.min(10, Math.round((contextRetention / Math.max(1, messageCount - 1)) * 2));
    naturalFlow = Math.min(10, Math.round(naturalFlow / Math.max(1, messageCount - 1)));
    topicHandling = Math.min(10, topicHandling);
    memoryOfDetails = Math.min(10, memoryOfDetails);

    const summary = `Context Retention: ${contextRetention}/10, Natural Flow: ${naturalFlow}/10, Topic Handling: ${topicHandling}/10, Memory: ${memoryOfDetails}/10`;

    return {
      scores: { contextRetention, naturalFlow, topicHandling, memoryOfDetails },
      summary,
      examples: { good: goodExamples, bad: badExamples }
    };
  }

  private checkContextReferences(prevMessages: Array<{ input: string; output: string }>, currentResponse: string): { score: number; example: string } {
    let score = 0;
    let example = '';

    if (!currentResponse || !prevMessages || prevMessages.length === 0) {
      return { score: 0, example: 'No previous context or current response' };
    }

    // Look for references to previous topics, names, products, etc.
    const prevText = prevMessages
      .map(m => (m.input || '') + ' ' + (m.output || ''))
      .join(' ')
      .toLowerCase();
    const currentResponseLower = currentResponse.toLowerCase();

    // Check for specific entity continuity
    const entities = this.extractEntities(prevText);
    for (const entity of entities) {
      if (currentResponseLower.includes(entity.toLowerCase())) {
        score += 2;
        example = `Referenced "${entity}" from previous context`;
        break;
      }
    }

    // Check for pronoun usage indicating context awareness
    if (currentResponseLower.includes('that') || currentResponseLower.includes('this') || 
        currentResponseLower.includes('as mentioned') || currentResponseLower.includes('earlier')) {
      score += 1;
      if (!example) example = 'Used contextual references like "that" or "as mentioned"';
    }

    return { score, example };
  }

  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    // Extract potential product names (capitalized words)
    const words = text.split(/\s+/);
    const productPattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/;
    
    for (let i = 0; i < words.length; i++) {
      if (words[i].match(/^[A-Z][a-zA-Z0-9]+$/) && words[i].length > 3) {
        entities.push(words[i]);
      }
    }

    // Extract numbers that might be prices, part numbers, etc.
    const numberMatches = text.match(/\$?\d+\.?\d*/g);
    if (numberMatches) {
      entities.push(...numberMatches);
    }

    return [...new Set(entities)]; // Remove duplicates
  }

  private assessNaturalFlow(prevInput: string, prevOutput: string, currentInput: string, currentOutput: string): { score: number; example: string } {
    let score = 5; // Base score
    let example = '';

    // Check if current input logically follows previous output
    const prevOutputLower = prevOutput.toLowerCase();
    const currentInputLower = currentInput.toLowerCase();
    
    // Good flow indicators
    if (currentInputLower.includes('what about') || currentInputLower.includes('also') ||
        currentInputLower.includes('and') || currentInputLower.includes('but')) {
      score += 2;
      example = 'Natural follow-up question structure';
    }

    // Check if response appropriately addresses the input
    if (currentOutput.length > 20 && !currentOutput.toLowerCase().includes('sorry') &&
        !currentOutput.toLowerCase().includes("don't know")) {
      score += 1;
    } else {
      score -= 2;
      example = 'Response seems uncertain or incomplete';
    }

    // Check for abrupt topic changes without acknowledgment
    if (this.isAbruptTopicChange(prevOutput, currentInput) && !currentOutput.includes('understand')) {
      score -= 3;
      example = 'Abrupt topic change handled poorly';
    }

    return { score: Math.max(0, Math.min(10, score)), example };
  }

  private isAbruptTopicChange(prevOutput: string, currentInput: string): boolean {
    // Simple heuristic: check if there are no common significant words
    const prevWords = new Set(prevOutput.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    const currentWords = new Set(currentInput.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    
    const intersection = new Set([...prevWords].filter(w => currentWords.has(w)));
    return intersection.size === 0 && prevWords.size > 0 && currentWords.size > 0;
  }

  private extractTopics(conversationLog: Array<{ input: string; output: string }>): string[] {
    const topics: string[] = [];
    const topicKeywords = {
      'product': ['part', 'product', 'item', 'buy', 'purchase'],
      'pricing': ['price', 'cost', 'expensive', 'cheap', 'discount'],
      'support': ['help', 'problem', 'issue', 'broken', 'repair'],
      'order': ['order', 'delivery', 'shipping', 'track'],
      'account': ['account', 'login', 'password', 'profile']
    };

    const allText = conversationLog.map(m => m.input + ' ' + m.output).join(' ').toLowerCase();
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  private assessTopicHandling(conversationLog: Array<{ input: string; output: string }>, topics: string[]): number {
    // For now, return a base score - could be enhanced with more sophisticated analysis
    return topics.length <= 3 ? 8 : Math.max(5, 10 - topics.length);
  }

  private assessDetailMemory(conversationLog: Array<{ input: string; output: string }>): { score: number; examples: { good: string[]; bad: string[] } } {
    let score = 5;
    const goodExamples: string[] = [];
    const badExamples: string[] = [];

    // Look for specific details mentioned early that should be remembered later
    const details: Array<{ detail: string; mentionedAt: number }> = [];
    
    for (let i = 0; i < conversationLog.length; i++) {
      const text = conversationLog[i].input + ' ' + conversationLog[i].output;
      
      // Extract potential details (names, products, numbers)
      const names = text.match(/[A-Z][a-z]+ [A-Z][a-z]+/g); // Likely names
      const products = text.match(/\b[A-Z][A-Z0-9-]+ ?[A-Z0-9-]*\b/g); // Product codes
      const prices = text.match(/\$\d+\.?\d*/g);
      
      if (names) details.push(...names.map(d => ({ detail: d, mentionedAt: i })));
      if (products) details.push(...products.map(d => ({ detail: d, mentionedAt: i })));
      if (prices) details.push(...prices.map(d => ({ detail: d, mentionedAt: i })));
    }

    // Check if details mentioned early are referenced later
    for (const detail of details) {
      if (detail.mentionedAt < conversationLog.length - 2) {
        const laterMessages = conversationLog.slice(detail.mentionedAt + 2);
        const isRemembered = laterMessages.some(m => 
          m.output.toLowerCase().includes(detail.detail.toLowerCase())
        );
        
        if (isRemembered) {
          score += 2;
          goodExamples.push(`Remembered detail "${detail.detail}" from earlier in conversation`);
        } else {
          score -= 1;
          badExamples.push(`Failed to remember detail "${detail.detail}" mentioned earlier`);
        }
      }
    }

    return {
      score: Math.max(0, Math.min(10, score)),
      examples: { good: goodExamples, bad: badExamples }
    };
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Conversation Flow Test Suite');
    console.log('================================================\n');

    // Test Scenario 1: Greeting → Product → Problem
    await this.runConversation(
      'Greeting to Product to Problem Flow',
      [
        'Hi there! I need help finding a part for my car.',
        'I have a 2018 Honda Civic and I need brake pads for the front wheels.',
        'Actually, I just realized my brake pedal feels spongy. Could this be related to the brake pads?',
        'What would you recommend I do? Should I replace the pads first or check something else?'
      ],
      `test-session-${++this.conversationCounter}`
    );

    // Test Scenario 2: Technical Discussion with Clarifications
    await this.runConversation(
      'Technical Discussion with Clarifications',
      [
        'I need help with my engine making a strange noise.',
        'It\'s a rattling sound that happens when I accelerate, especially uphill.',
        'Wait, let me be more specific - it only happens when the engine is cold, not after it warms up.',
        'Could this be a timing chain issue? I heard that can cause rattling.'
      ],
      `test-session-${++this.conversationCounter}`
    );

    // Test Scenario 3: Order Inquiry to Complaint
    await this.runConversation(
      'Order Inquiry Evolution to Complaint',
      [
        'Can you help me track my order? The reference number is TS-2024-001234.',
        'I ordered it last week and was told it would arrive by Friday.',
        'It\'s now Monday and I still haven\'t received it. This is really frustrating.',
        'I need this part urgently for my business vehicle. What compensation can you offer for this delay?'
      ],
      `test-session-${++this.conversationCounter}`
    );

    // Test Scenario 4: Price Negotiation Across Multiple Messages
    await this.runConversation(
      'Price Negotiation Conversation',
      [
        'I\'m interested in buying brake discs for a Ford Focus. What\'s your best price?',
        'That seems expensive compared to other suppliers. I found them for £30 less elsewhere.',
        'I\'ve been a customer for 3 years and have spent over £2000 with you. Can you do better?',
        'What if I buy the brake pads as well? Would you give me a package deal?'
      ],
      `test-session-${++this.conversationCounter}`
    );

    // Test Scenario 5: Topic Changes and Interruptions
    await this.runConversation(
      'Topic Changes and Interruption Handling',
      [
        'I need oil filters for a BMW 320d.',
        'Actually, before we continue with that, I just remembered I also need wiper blades.',
        'Sorry, going back to the oil filters - do you have genuine BMW ones or just aftermarket?',
        'And about those wiper blades, they\'re for the same car. Can you check availability for both items?'
      ],
      `test-session-${++this.conversationCounter}`
    );

    console.log('\n✅ All conversation tests completed!');
    this.generateReport();
  }

  private generateReport(): void {
    console.log('\n📊 COMPREHENSIVE CONVERSATION FLOW ANALYSIS REPORT');
    console.log('=================================================');

    let totalContextRetention = 0;
    let totalNaturalFlow = 0;
    let totalTopicHandling = 0;
    let totalMemoryOfDetails = 0;

    console.log('\n📋 INDIVIDUAL SCENARIO RESULTS:');
    console.log('--------------------------------');

    this.testResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.scenario}`);
      console.log(`   Context Retention: ${result.scores.contextRetention}/10`);
      console.log(`   Natural Flow: ${result.scores.naturalFlow}/10`);
      console.log(`   Topic Handling: ${result.scores.topicHandling}/10`);
      console.log(`   Memory of Details: ${result.scores.memoryOfDetails}/10`);
      console.log(`   Analysis: ${result.analysis}`);
      
      if (result.examples.good.length > 0) {
        console.log(`   ✅ Good Examples:`);
        result.examples.good.forEach(example => console.log(`      • ${example}`));
      }
      
      if (result.examples.bad.length > 0) {
        console.log(`   ❌ Issues Found:`);
        result.examples.bad.forEach(example => console.log(`      • ${example}`));
      }

      totalContextRetention += result.scores.contextRetention;
      totalNaturalFlow += result.scores.naturalFlow;
      totalTopicHandling += result.scores.topicHandling;
      totalMemoryOfDetails += result.scores.memoryOfDetails;
    });

    const numTests = this.testResults.length;
    console.log('\n🎯 OVERALL SCORES:');
    console.log('==================');
    console.log(`Context Retention: ${(totalContextRetention / numTests).toFixed(1)}/10`);
    console.log(`Natural Flow: ${(totalNaturalFlow / numTests).toFixed(1)}/10`);
    console.log(`Topic Handling: ${(totalTopicHandling / numTests).toFixed(1)}/10`);
    console.log(`Memory of Details: ${(totalMemoryOfDetails / numTests).toFixed(1)}/10`);
    console.log(`Overall Average: ${((totalContextRetention + totalNaturalFlow + totalTopicHandling + totalMemoryOfDetails) / (numTests * 4)).toFixed(1)}/10`);

    console.log('\n🔍 KEY INSIGHTS:');
    console.log('================');
    
    // Analyze patterns across all conversations
    const allGoodExamples = this.testResults.flatMap(r => r.examples.good);
    const allBadExamples = this.testResults.flatMap(r => r.examples.bad);
    
    if (allGoodExamples.length > 0) {
      console.log('✅ Strengths:');
      const strengthPatterns = this.findPatterns(allGoodExamples);
      strengthPatterns.forEach(pattern => console.log(`   • ${pattern}`));
    }
    
    if (allBadExamples.length > 0) {
      console.log('\n❌ Areas for Improvement:');
      const weaknessPatterns = this.findPatterns(allBadExamples);
      weaknessPatterns.forEach(pattern => console.log(`   • ${pattern}`));
    }

    console.log('\n📈 RECOMMENDATIONS:');
    console.log('===================');
    if (totalContextRetention / numTests < 7) {
      console.log('• Improve context retention by maintaining conversation history and referencing previous topics');
    }
    if (totalNaturalFlow / numTests < 7) {
      console.log('• Enhance natural flow by better acknowledging topic changes and providing smoother transitions');
    }
    if (totalTopicHandling / numTests < 7) {
      console.log('• Better handle multiple topics by explicitly acknowledging switches and maintaining context');
    }
    if (totalMemoryOfDetails / numTests < 7) {
      console.log('• Strengthen detail memory by storing and referencing specific customer information throughout conversations');
    }
  }

  private findPatterns(examples: string[]): string[] {
    // Simple pattern finding - could be enhanced
    const patterns: string[] = [];
    
    if (examples.some(e => e.includes('context'))) {
      patterns.push('Good at maintaining conversation context');
    }
    if (examples.some(e => e.includes('Referenced'))) {
      patterns.push('Successfully references previous information');
    }
    if (examples.some(e => e.includes('Missing') || e.includes('Failed'))) {
      patterns.push('Struggles with information retention');
    }
    if (examples.some(e => e.includes('flow'))) {
      patterns.push('Natural conversation flow handling needs work');
    }
    
    return patterns;
  }
}

// Run the test suite
async function main() {
  const tester = new ConversationTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { ConversationTester };