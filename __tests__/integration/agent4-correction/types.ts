export interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: any[];
}

export interface TestResult {
  response: string;
  conversationId: string;
  metadata: any;
}

export interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  correctionTests: number;
  correctionPassed: number;
  listReferenceTests: number;
  listReferencePassed: number;
  executionTimes: number[];
}
