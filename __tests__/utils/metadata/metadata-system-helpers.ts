/**
 * Metadata System Test Helpers
 *
 * Shared utilities for metadata system E2E testing.
 * Extracted from 551 LOC test-metadata-system-e2e.ts.
 *
 * Last Updated: 2025-11-10
 * Related: __tests__/integration/metadata-system/
 */

import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Test result interface - uniform reporting across all test modules
 */
export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

/**
 * Formatted console output helpers
 */
export function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70));
}

export function logTest(result: TestResult) {
  const icon = result.passed ? '✅' : '❌';
  console.log(`\n${icon} ${result.name}`);
  console.log(`   ${result.details}`);
  console.log(`   ⏱️  ${result.duration.toFixed(0)}ms`);
}

/**
 * Create test conversation in database
 */
export async function createTestConversation(
  sessionIdPrefix: string = 'test_e2e'
): Promise<{ conversationId: string; domainId: string } | null> {
  try {
    const supabase = await createServiceRoleClient();

    // Get a test domain
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .limit(1)
      .single();

    if (domainError || !domain) {
      return null;
    }

    // Create test conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        session_id: `${sessionIdPrefix}_${Date.now()}_${Math.random()}`,
        domain_id: domain.id,
        metadata: {}
      })
      .select()
      .single();

    if (convError || !conversation) {
      return null;
    }

    return {
      conversationId: conversation.id,
      domainId: domain.id
    };
  } catch (error) {
    return null;
  }
}

/**
 * Cleanup test conversation from database
 */
export async function cleanupTestConversation(conversationId: string): Promise<boolean> {
  try {
    const supabase = await createServiceRoleClient();
    await supabase.from('conversations').delete().eq('id', conversationId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Save metadata to database conversation
 */
export async function saveMetadataToConversation(
  conversationId: string,
  manager: ConversationMetadataManager
): Promise<boolean> {
  try {
    const supabase = await createServiceRoleClient();
    const metadataObj = JSON.parse(manager.serialize());

    const { error } = await supabase
      .from('conversations')
      .update({ metadata: metadataObj })
      .eq('id', conversationId);

    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Load metadata from database conversation
 */
export async function loadMetadataFromConversation(
  conversationId: string
): Promise<any> {
  try {
    const supabase = await createServiceRoleClient();

    const { data, error } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.metadata;
  } catch (error) {
    return null;
  }
}

/**
 * Verify metadata database structure
 */
export async function verifyMetadataStructure(metadata: any): Promise<{
  valid: boolean;
  missing: string[];
}> {
  const required = ['currentTurn', 'entities', 'corrections', 'lists'];
  const missing = required.filter(field => !(field in metadata));

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Create standard test metadata manager with sample data
 */
export function createTestMetadataManager(): ConversationMetadataManager {
  const manager = new ConversationMetadataManager();
  manager.incrementTurn();

  manager.trackEntity({
    id: 'product_1',
    type: 'product',
    value: 'Blue Widget',
    aliases: ['it', 'that', 'the product'],
    turnNumber: 1,
    metadata: { url: 'https://example.com/blue-widget' }
  });

  return manager;
}

/**
 * Report test results with summary
 */
export function reportTestResults(results: TestResult[], sectionTitle: string = 'TEST RESULTS') {
  logSection(sectionTitle);

  results.forEach(result => logTest(result));

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  logSection('SUMMARY');
  console.log(`\n✅ Tests Passed: ${passed}/${total}`);
  console.log(`⏱️  Total Time: ${totalTime.toFixed(0)}ms`);

  return { passed, total, totalTime };
}
