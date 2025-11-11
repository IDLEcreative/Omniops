export type OperationCategory = 'Product' | 'Order' | 'Store' | 'Cart' | 'Analytics';

export interface OperationTest {
  name: string;
  operation: string;
  params: Record<string, any>;
  category: OperationCategory;
}

export interface OperationGroup {
  title: string;
  operations: OperationTest[];
}

export interface TestResult {
  operation: string;
  category: OperationCategory;
  status: 'PASS' | 'FAIL' | 'VALIDATION';
  duration: number;
  message: string;
  error?: string;
}
