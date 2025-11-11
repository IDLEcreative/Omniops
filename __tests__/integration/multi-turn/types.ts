export interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{ url: string; title: string; relevance: number }>;
}

export interface TestResult {
  testName: string;
  passed: boolean;
  reason: string;
  conversationId?: string;
}

export interface AccuracyResult extends TestResult {
  accuracy?: number;
}
