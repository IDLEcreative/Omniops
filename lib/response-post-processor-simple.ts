/**
 * Simple Response Pass-Through
 * Trusts AI to make intelligent presentation decisions
 */

interface PostProcessResult {
  processed: string;
  wasModified: boolean;
}

export class SimpleResponseProcessor {
  /**
   * Pass through AI response unchanged
   * Trust AI's judgment on what to present
   */
  static process(aiResponse: string): PostProcessResult {
    return {
      processed: aiResponse,
      wasModified: false
    };
  }
}

export default SimpleResponseProcessor;