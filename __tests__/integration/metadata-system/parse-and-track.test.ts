/**
 * Parse and Track Entities Integration Test
 *
 * Tests parseAndTrackEntities function for entity parsing, tracking,
 * and context generation.
 */

import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { parseAndTrackEntities } from '@/lib/chat/response-parser';
import { TestResult, logTest } from '../../utils/metadata/metadata-system-helpers';

export async function testParseAndTrackEntities(): Promise<TestResult> {
  const start = Date.now();
  try {
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();

    // Test parsing and tracking
    const aiResponse =
      'Here is the [Premium Widget](https://example.com/premium) and order #98765. I corrected the previous recommendation.';
    const userMessage = 'I meant the silver one not the gold one';

    await parseAndTrackEntities(aiResponse, userMessage, manager);

    // Verify entities were tracked
    const resolvedEntity = manager.resolveReference('it');
    const contextSummary = manager.generateContextSummary();

    if (!contextSummary.includes('Product') && !contextSummary.includes('order')) {
      throw new Error('Context summary does not reflect tracked entities');
    }

    return {
      name: 'parseAndTrackEntities Integration',
      passed: true,
      details: 'Parser integrated with metadata manager: entities, corrections, context generation',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'parseAndTrackEntities Integration',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

// Run if executed directly
if (require.main === module) {
  testParseAndTrackEntities().then(result => {
    logTest(result);
    process.exit(result.passed ? 0 : 1);
  });
}
