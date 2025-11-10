/**
 * Multi-Language Support E2E Tests (Orchestrator)
 *
 * This orchestrator imports all i18n test modules.
 * Individual test modules are located in ./multi-language/
 *
 * Original file was 523 LOC and included:
 * - Language detection
 * - Translation/language switching
 * - RTL support
 * - Locale formatting
 * - Active conversation language switching
 * - Complete workflow tests
 *
 * Refactored into focused modules (<300 LOC each):
 * - language-detection.spec.ts
 * - translation.spec.ts
 * - rtl-support.spec.ts
 * - locale-formatting.spec.ts
 * - language-switching.spec.ts
 * - complete-workflow.spec.ts
 *
 * Shared utilities in __tests__/utils/playwright/i18n-test-helpers.ts
 *
 * This pattern ensures:
 * ✅ Each module has single responsibility
 * ✅ No code duplication via shared helpers
 * ✅ Easy to maintain and extend
 * ✅ Tests can run independently or together
 */

import './multi-language/language-detection.spec';
import './multi-language/translation.spec';
import './multi-language/rtl-support.spec';
import './multi-language/locale-formatting.spec';
import './multi-language/language-switching.spec';
import './multi-language/complete-workflow.spec';
