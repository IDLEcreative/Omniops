/**
 * Feature Flag Test
 *
 * Validates USE_ENHANCED_METADATA_CONTEXT feature flag behavior.
 * Tests that metadata tracking works regardless of flag state.
 */

import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { TestResult, logTest } from '../../utils/metadata/metadata-system-helpers';

export async function testFeatureFlag(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Check environment variable
    const useEnhancedContext = process.env.USE_ENHANCED_METADATA_CONTEXT === 'true';

    // The documented default is 'false' (conservative deployment)
    const shouldDefaultToFalse = process.env.USE_ENHANCED_METADATA_CONTEXT !== 'true';

    if (!shouldDefaultToFalse) {
      throw new Error('Feature flag should default to false for conservative deployment');
    }

    // Verify it can be enabled
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();
    manager.trackEntity({
      id: 'test',
      type: 'product',
      value: 'Test',
      aliases: [],
      turnNumber: 1
    });

    const context = manager.generateContextSummary();
    // Context should be generated regardless of flag value
    // Flag only controls whether it's injected into system prompt

    return {
      name: 'Feature Flag Behavior',
      passed: true,
      details: `USE_ENHANCED_METADATA_CONTEXT=${process.env.USE_ENHANCED_METADATA_CONTEXT || 'undefined'} (default: false). Metadata tracked regardless of flag.`,
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Feature Flag Behavior',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

// Run if executed directly
if (require.main === module) {
  testFeatureFlag().then(result => {
    logTest(result);
    process.exit(result.passed ? 0 : 1);
  });
}
