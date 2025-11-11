/**
 * Injection Prevention Edge Case Tests
 *
 * CRITICAL: Tests SQL injection, NoSQL injection, command injection, and other injection attacks.
 * The suites are split across helper modules so this orchestrator stays within LOC limits.
 */

import { describe } from '@jest/globals';
import { runSqlInjectionTests } from './injection-prevention/sql-injection-tests';
import { runNoSqlInjectionTests } from './injection-prevention/nosql-injection-tests';
import { runCommandInjectionTests } from './injection-prevention/command-injection-tests';
import { runPathTraversalTests } from './injection-prevention/path-traversal-tests';
import { runXssTests } from './injection-prevention/xss-tests';
import { runJsonInjectionTests } from './injection-prevention/json-injection-tests';
import { runProtocolInjectionTests } from './injection-prevention/protocol-injection-tests';
import { runRealWorldInjectionTests } from './injection-prevention/real-world-tests';

describe('Injection Prevention Edge Cases', () => {
  runSqlInjectionTests();
  runNoSqlInjectionTests();
  runCommandInjectionTests();
  runPathTraversalTests();
  runXssTests();
  runJsonInjectionTests();
  runProtocolInjectionTests();
  runRealWorldInjectionTests();
});
