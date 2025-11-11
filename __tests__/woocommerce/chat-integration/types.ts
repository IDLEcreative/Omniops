export interface ChatRequest {
  message: string;
  domain: string;
  session_id: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: any[];
  searchMetadata?: any;
}

export type TestStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface TestResult {
  category: string;
  operation: string;
  query: string;
  status: TestStatus;
  duration: number;
  response?: string;
  error?: string;
  toolUsed?: string;
}

export interface OperationTest {
  category: string;
  operation: string;
  query: string;
  expectedToolPattern?: string;
}
