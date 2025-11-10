#!/usr/bin/env npx tsx
import { runCustomerFlowTests } from './tests/customer-flow/runner';

runCustomerFlowTests().catch(error => {
  console.error('Customer flow test failed:', error);
  process.exit(1);
});
