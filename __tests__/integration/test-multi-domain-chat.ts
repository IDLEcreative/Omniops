/**
 * Multi-Domain Chat Tests Orchestrator
 *
 * This file imports all multi-domain test modules. Individual test files
 * are organized in the ./multi-domain/ directory for better maintainability.
 *
 * Refactored from 520 LOC single file to 6 focused modules (<150 LOC each).
 * See ./multi-domain/README.md for complete test documentation.
 *
 * Run: npm test -- __tests__/integration/test-multi-domain-chat.ts
 */

// Import all multi-domain test modules
import './multi-domain/domain-isolation.test';
import './multi-domain/cross-domain-prevention.test';
import './multi-domain/domain-config.test';
import './multi-domain/data-separation.test';
import './multi-domain/domain-switching.test';
import './multi-domain/multi-tenant-workflows.test';
