/**
 * Multi-Turn Conversation E2E Tests (Tests 8-13)
 * CRITICAL: Makes REAL API calls to validate 86% conversation accuracy claim
 */

import { runMultiTurnSuite } from './runner';

runMultiTurnSuite().catch((error) => {
  console.error(error);
  process.exit(1);
});
