/**
 * Analytics Export E2E Tests Orchestrator
 *
 * This orchestrator imports all analytics export test modules.
 * Individual test modules are located in ./analytics-exports/
 *
 * Test Structure:
 * - csv-export.spec.ts: CSV export generation and validation
 * - pdf-export.spec.ts: PDF/Excel export and file naming
 * - data-validation.spec.ts: API responses and data accuracy
 * - error-handling.spec.ts: Error scenarios and edge cases
 * - download-flows.spec.ts: Download workflows and performance
 *
 * Refactored from 601 LOC to focused modules (<300 LOC each).
 * See ./analytics-exports/README.md for detailed documentation.
 */

import './analytics-exports/csv-export.spec';
import './analytics-exports/pdf-export.spec';
import './analytics-exports/data-validation.spec';
import './analytics-exports/error-handling.spec';
import './analytics-exports/download-flows.spec';
