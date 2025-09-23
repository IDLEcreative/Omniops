#!/usr/bin/env npx tsx
/**
 * Edge Cases and Stress Testing for Agent Conversations
 * Tests unusual scenarios, error handling, and boundary conditions
 */

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/chat';
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'thompsonseparts.co.uk';

interface ChatRequest {
  message: string;
  conversation_id?: string;
  session_id: string;
  domain: string;
  config?: any;
}

interface EdgeCaseTest {
  name: string;
  description: string;
  test: () => Promise<boolean>;
}

class EdgeCaseTester {
  private async sendMessage(
    message: string,
    options: Partial<ChatRequest> = {}
  ): Promise<any> {
    const request: ChatRequest = {
      message,
      session_id: uuidv4(),
      domain: TEST_DOMAIN,
      ...options,
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async testEmptyMessage(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Empty message'));
    const result = await this.sendMessage('');
    
    if (!result.ok || result.data.error) {
      console.log(chalk.green('   ✅ Correctly rejected empty message'));
      return true;
    } else {
      console.log(chalk.red('   ❌ Should reject empty messages'));
      return false;
    }
  }

  async testVeryLongMessage(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Very long message (10,000 chars)'));
    const longMessage = 'I need help with pumps. ' + 'x'.repeat(9975);
    const result = await this.sendMessage(longMessage);
    
    if (result.ok && result.data.message) {
      console.log(chalk.green('   ✅ Handled long message gracefully'));
      return true;
    } else {
      console.log(chalk.red('   ❌ Failed to handle long message'));
      return false;
    }
  }

  async testSpecialCharacters(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Special characters and emojis'));
    const specialMessage = 'Need pump for Cifa™ mixer 😊 €500 budget! <script>alert("test")</script>';
    const result = await this.sendMessage(specialMessage);
    
    if (result.ok && result.data.message && !result.data.message.includes('<script>')) {
      console.log(chalk.green('   ✅ Handled special characters safely'));
      return true;
    } else {
      console.log(chalk.red('   ❌ Failed to handle special characters safely'));
      return false;
    }
  }

  async testRapidFireMessages(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Rapid fire messages (10 in parallel)'));
    const sessionId = uuidv4();
    let conversationId: string | undefined;
    
    const promises = Array(10).fill(0).map((_, i) => 
      this.sendMessage(`Quick question ${i + 1}: Do you have pumps?`, {
        session_id: sessionId,
        conversation_id: conversationId,
      })
    );
    
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    if (successful >= 8) {
      console.log(chalk.green(`   ✅ Handled rapid messages (${successful}/10 successful)`));
      return true;
    } else {
      console.log(chalk.red(`   ❌ Poor handling of rapid messages (${successful}/10 successful)`));
      return false;
    }
  }

  async testMultilingualInput(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Multilingual input'));
    const messages = [
      'Necesito una bomba para mi mezcladora Cifa',
      'J\'ai besoin d\'une pompe pour mon mélangeur Cifa',
      'Ich brauche eine Pumpe für meinen Cifa-Mischer',
      '我需要一个Cifa混合器的泵',
    ];
    
    let successCount = 0;
    for (const msg of messages) {
      const result = await this.sendMessage(msg);
      if (result.ok && result.data.message) {
        successCount++;
      }
    }
    
    if (successCount >= 3) {
      console.log(chalk.green(`   ✅ Handled multilingual input (${successCount}/4 successful)`));
      return true;
    } else {
      console.log(chalk.red(`   ❌ Poor multilingual support (${successCount}/4 successful)`));
      return false;
    }
  }

  async testConversationRecovery(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Conversation recovery after interruption'));
    const sessionId = uuidv4();
    
    const result1 = await this.sendMessage('I need a pump for my Cifa mixer', {
      session_id: sessionId,
    });
    
    if (!result1.ok || !result1.data.conversation_id) {
      console.log(chalk.red('   ❌ Failed to start conversation'));
      return false;
    }
    
    const conversationId = result1.data.conversation_id;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result2 = await this.sendMessage('What was I asking about?', {
      session_id: sessionId,
      conversation_id: conversationId,
    });
    
    if (result2.ok && result2.data.message) {
      const response = result2.data.message.toLowerCase();
      if (response.includes('pump') || response.includes('cifa') || response.includes('mixer')) {
        console.log(chalk.green('   ✅ Successfully recovered conversation context'));
        return true;
      }
    }
    
    console.log(chalk.red('   ❌ Failed to recover conversation context'));
    return false;
  }

  async testInvalidConversationId(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Invalid conversation ID'));
    const result = await this.sendMessage('Tell me about pumps', {
      conversation_id: 'invalid-id-12345',
    });
    
    if (result.ok && result.data.message) {
      console.log(chalk.green('   ✅ Gracefully handled invalid conversation ID'));
      return true;
    } else {
      console.log(chalk.red('   ❌ Failed with invalid conversation ID'));
      return false;
    }
  }

  async testNumberedListMemory(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Complex numbered list memory'));
    const sessionId = uuidv4();
    
    const result1 = await this.sendMessage(
      'List exactly 5 different types of pumps you have',
      { session_id: sessionId }
    );
    
    if (!result1.ok || !result1.data.conversation_id) {
      console.log(chalk.red('   ❌ Failed to get initial list'));
      return false;
    }
    
    const conversationId = result1.data.conversation_id;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result2 = await this.sendMessage('Tell me about items 2, 3, and 5', {
      session_id: sessionId,
      conversation_id: conversationId,
    });
    
    if (result2.ok && result2.data.message) {
      const response = result2.data.message.toLowerCase();
      if (response.includes('2') || response.includes('3') || response.includes('5') || 
          response.includes('second') || response.includes('third') || response.includes('fifth')) {
        console.log(chalk.green('   ✅ Correctly referenced numbered list items'));
        return true;
      }
    }
    
    console.log(chalk.red('   ❌ Failed to reference numbered list items'));
    return false;
  }

  async testCircularReference(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Circular reference handling'));
    const sessionId = uuidv4();
    
    const result1 = await this.sendMessage('What pumps do you have?', {
      session_id: sessionId,
    });
    
    if (!result1.ok || !result1.data.conversation_id) {
      console.log(chalk.red('   ❌ Failed to start conversation'));
      return false;
    }
    
    const conversationId = result1.data.conversation_id;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const circularMessages = [
      'What did I just ask?',
      'And what did I ask before that?',
      'What was my question before the previous one?',
    ];
    
    let lastResult = result1;
    for (const msg of circularMessages) {
      lastResult = await this.sendMessage(msg, {
        session_id: sessionId,
        conversation_id: conversationId,
      });
      
      if (!lastResult.ok) {
        console.log(chalk.red('   ❌ Failed during circular reference'));
        return false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(chalk.green('   ✅ Handled circular references without crashing'));
    return true;
  }

  async testAmbiguousPronounResolution(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Ambiguous pronoun resolution'));
    const sessionId = uuidv4();
    
    const conversation = [
      'I need a pump and a seal kit',
      'How much does it cost?',
      'Is it available?',
      'Can you ship it tomorrow?',
    ];
    
    let conversationId: string | undefined;
    let lastResponse = '';
    
    for (const msg of conversation) {
      const result = await this.sendMessage(msg, {
        session_id: sessionId,
        conversation_id: conversationId,
      });
      
      if (!result.ok) {
        console.log(chalk.red('   ❌ Conversation failed'));
        return false;
      }
      
      conversationId = result.data.conversation_id;
      lastResponse = result.data.message;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const response = lastResponse.toLowerCase();
    if (response.includes('which') || response.includes('pump') || 
        response.includes('seal') || response.includes('both')) {
      console.log(chalk.green('   ✅ Handled ambiguous pronouns appropriately'));
      return true;
    }
    
    console.log(chalk.red('   ❌ Failed to handle ambiguous pronouns'));
    return false;
  }

  async testMemoryOverflow(): Promise<boolean> {
    console.log(chalk.yellow('   Testing: Long conversation memory (50 messages)'));
    const sessionId = uuidv4();
    let conversationId: string | undefined;
    
    for (let i = 0; i < 50; i++) {
      const result = await this.sendMessage(
        `Question ${i + 1}: Tell me about pump model P${i + 1}`,
        {
          session_id: sessionId,
          conversation_id: conversationId,
        }
      );
      
      if (!result.ok) {
        console.log(chalk.red(`   ❌ Failed at message ${i + 1}`));
        return false;
      }
      
      conversationId = result.data.conversation_id;
      
      if (i % 10 === 0) {
        console.log(chalk.gray(`     Progress: ${i + 1}/50 messages`));
      }
    }
    
    const finalResult = await this.sendMessage(
      'What was the first pump I asked about?',
      {
        session_id: sessionId,
        conversation_id: conversationId,
      }
    );
    
    if (finalResult.ok && finalResult.data.message) {
      console.log(chalk.green('   ✅ Handled 50+ message conversation'));
      return true;
    }
    
    console.log(chalk.red('   ❌ Failed with long conversation'));
    return false;
  }
}

async function runEdgeCaseTests() {
  console.log(chalk.bold.cyan('\n🔬 AGENT CONVERSATION EDGE CASE TEST SUITE'));
  console.log(chalk.bold.cyan('=' .repeat(70)));
  console.log(chalk.gray(`Testing API: ${API_URL}`));
  console.log(chalk.gray(`Test Domain: ${TEST_DOMAIN}`));

  const tester = new EdgeCaseTester();
  
  const tests: EdgeCaseTest[] = [
    {
      name: 'Empty Message Handling',
      description: 'Test how the agent handles empty messages',
      test: () => tester.testEmptyMessage(),
    },
    {
      name: 'Very Long Message',
      description: 'Test message length limits',
      test: () => tester.testVeryLongMessage(),
    },
    {
      name: 'Special Characters',
      description: 'Test handling of special characters and potential XSS',
      test: () => tester.testSpecialCharacters(),
    },
    {
      name: 'Rapid Fire Messages',
      description: 'Test concurrent message handling',
      test: () => tester.testRapidFireMessages(),
    },
    {
      name: 'Multilingual Input',
      description: 'Test handling of non-English input',
      test: () => tester.testMultilingualInput(),
    },
    {
      name: 'Conversation Recovery',
      description: 'Test recovery after interruption',
      test: () => tester.testConversationRecovery(),
    },
    {
      name: 'Invalid Conversation ID',
      description: 'Test handling of invalid conversation references',
      test: () => tester.testInvalidConversationId(),
    },
    {
      name: 'Numbered List Memory',
      description: 'Test complex list item referencing',
      test: () => tester.testNumberedListMemory(),
    },
    {
      name: 'Circular References',
      description: 'Test handling of self-referential questions',
      test: () => tester.testCircularReference(),
    },
    {
      name: 'Ambiguous Pronouns',
      description: 'Test resolution of ambiguous references',
      test: () => tester.testAmbiguousPronounResolution(),
    },
    {
      name: 'Memory Overflow',
      description: 'Test handling of very long conversations',
      test: () => tester.testMemoryOverflow(),
    },
  ];

  const results: { name: string; passed: boolean }[] = [];

  for (const test of tests) {
    console.log(chalk.cyan(`\n📋 ${test.name}`));
    console.log(chalk.gray(`   ${test.description}`));
    
    try {
      const passed = await test.test();
      results.push({ name: test.name, passed });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(chalk.red(`   ❌ Test crashed: ${error}`));
      results.push({ name: test.name, passed: false });
    }
  }

  console.log(chalk.bold.cyan('\n' + '=' .repeat(70)));
  console.log(chalk.bold.cyan('📊 EDGE CASE TEST RESULTS'));
  console.log(chalk.bold.cyan('=' .repeat(70)));

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? chalk.green('✅') : chalk.red('❌');
    const status = result.passed ? chalk.green('PASSED') : chalk.red('FAILED');
    console.log(`${icon} ${result.name}: ${status}`);
  });

  console.log(chalk.cyan('\n' + '─'.repeat(70)));
  console.log(chalk.bold(`Total Passed: ${chalk.green(passedCount)}/${tests.length}`));
  console.log(chalk.bold(`Total Failed: ${chalk.red(failedCount)}/${tests.length}`));
  
  const passRate = (passedCount / tests.length * 100).toFixed(1);
  const color = passedCount === tests.length ? chalk.green : 
                passedCount > tests.length / 2 ? chalk.yellow : chalk.red;
  
  console.log(chalk.bold(`Pass Rate: ${color(passRate + '%')}`));
  console.log(chalk.cyan('=' .repeat(70)));

  process.exit(failedCount > 0 ? 1 : 0);
}

runEdgeCaseTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});