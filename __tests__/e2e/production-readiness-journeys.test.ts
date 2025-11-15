/**
 * E2E Production Readiness - User Journey Tests
 * Tests complete user workflows and multi-turn conversations
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ProductionTestHelper } from './helpers/production-test-helper';

describe('Complete User Journeys', () => {
  let helper: ProductionTestHelper;

  beforeAll(() => {
    helper = new ProductionTestHelper();
  });

  it('should complete full product inquiry journey', async () => {
    const msg1 = await helper.sendMessage('Do you have laptops?');
    expect(msg1.data.message).toBeDefined();
    expect(msg1.data.conversation_id).toBeDefined();

    const msg2 = await helper.sendMessage('What are the specs?');
    expect(msg2.data.conversation_id).toBe(msg1.data.conversation_id);

    const msg3 = await helper.sendMessage('How much does it cost?');
    expect(msg3.data.conversation_id).toBe(msg1.data.conversation_id);

    const conversation = await helper.getConversation();
    expect(conversation.messages).toHaveLength(6);
  }, 10000);

  it('should handle support request journey', async () => {
    const helper2 = new ProductionTestHelper();

    await helper2.sendMessage('I have a problem with my order');
    await helper2.sendMessage('Order number 12345');
    const msg3 = await helper2.sendMessage('Can you help?');

    expect(msg3.data.message).toBeDefined();
    expect(msg3.data.conversation_id).toBeDefined();
  }, 10000);

  it('should handle multi-turn technical inquiry', async () => {
    const helper3 = new ProductionTestHelper();
    const messages = [
      'Tell me about your return policy',
      'How long do I have?',
      'What if the product is damaged?',
      'Do I need the original packaging?',
      'How do I start a return?',
    ];

    let prevConvId: string | undefined;

    for (const msg of messages) {
      const result = await helper3.sendMessage(msg);
      expect(result.data.conversation_id).toBeDefined();

      if (prevConvId) {
        expect(result.data.conversation_id).toBe(prevConvId);
      }

      prevConvId = result.data.conversation_id;
    }
  }, 15000);
});

describe('Cross-Page Persistence', () => {
  it('should maintain conversation across page navigation', async () => {
    const helper = new ProductionTestHelper();

    const msg1 = await helper.sendMessage('Hello on home page');
    const convId1 = msg1.data.conversation_id;

    await new Promise(resolve => setTimeout(resolve, 100));

    const msg2 = await helper.sendMessage('Now on product page');
    expect(msg2.data.conversation_id).toBe(convId1);

    await new Promise(resolve => setTimeout(resolve, 100));

    const msg3 = await helper.sendMessage('Now on cart page');
    expect(msg3.data.conversation_id).toBe(convId1);

    const conversation = await helper.getConversation();
    expect(conversation.messages).toHaveLength(6);
  }, 10000);

  it('should restore conversation after page refresh', async () => {
    const helper = new ProductionTestHelper();

    const msg1 = await helper.sendMessage('Before refresh');
    const originalConvId = msg1.data.conversation_id;

    await new Promise(resolve => setTimeout(resolve, 500));

    const msg2 = await helper.sendMessage('After refresh');

    expect(msg2.data.conversation_id).toBe(originalConvId);
  }, 10000);
});

describe('Multi-Tab Synchronization', () => {
  it('should sync conversation state across tabs', async () => {
    const sessionId = `multi-tab-${Date.now()}`;

    const tab1 = new ProductionTestHelper();
    (tab1 as any).sessionId = sessionId;

    const msg1 = await tab1.sendMessage('Message from tab 1');
    const convId = msg1.data.conversation_id;

    const tab2 = new ProductionTestHelper();
    (tab2 as any).sessionId = sessionId;
    (tab2 as any).conversationId = convId;

    const msg2 = await tab2.sendMessage('Message from tab 2');

    expect(msg2.data.conversation_id).toBe(convId);
  }, 10000);

  it('should handle rapid tab switching', async () => {
    const sessionId = `rapid-switch-${Date.now()}`;
    const tabs = [1, 2, 3].map(() => {
      const tab = new ProductionTestHelper();
      (tab as any).sessionId = sessionId;
      return tab;
    });

    const results = await Promise.all([
      tabs[0].sendMessage('Tab 1'),
      tabs[1].sendMessage('Tab 2'),
      tabs[2].sendMessage('Tab 3'),
    ]);

    const convId = results[0].data.conversation_id;
    expect(results.every(r => r.data.conversation_id === convId)).toBe(true);
  }, 10000);
});
