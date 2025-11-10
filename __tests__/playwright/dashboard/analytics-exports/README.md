# Analytics Export E2E Tests

This directory contains Playwright E2E tests for analytics export functionality. The tests verify CSV, PDF, and Excel export workflows, data accuracy, error handling, and performance.

**Status:** Refactored from 601 LOC into focused modules (refactoring completed 2025-11-10)

## Test Modules

### csv-export.spec.ts (137 LOC)
Tests CSV export generation, download, and file structure validation.

**Test Cases:**
- `export analytics as CSV: click → download → verify` - Full CSV workflow
- `verify CSV file structure and headers` - CSV format validation
- `CSV export with 30-day range` - Time range filtering

### pdf-export.spec.ts (110 LOC)
Tests PDF and Excel export generation and file validation.

**Test Cases:**
- `verify file naming convention for all formats` - Naming pattern validation
- `PDF export with 90-day range` - Extended time range
- `Excel export validation` - XLSX file integrity

### data-validation.spec.ts (178 LOC)
Tests data accuracy, structure validation, and API response formats.

**Test Cases:**
- `verify JSON analytics data structure` - API response validation
- `export with date range filter applied` - Filter application
- `validate CSV data accuracy and formatting` - Data integrity
- `verify API endpoint responses` - Endpoint availability

### error-handling.spec.ts (185 LOC)
Tests error scenarios, empty data handling, authentication, and graceful degradation.

**Test Cases:**
- `export with empty data: handle gracefully` - Empty state handling
- `export with user authentication and permissions` - Auth validation
- `handle invalid export format gracefully` - Format error handling
- `handle missing query parameters` - Parameter validation
- `handle request timeout gracefully` - Timeout recovery

### download-flows.spec.ts (220 LOC)
Tests complete download workflows, UI suggestions, and performance with large datasets.

**Test Cases:**
- `complete export workflow: UI suggestion for missing buttons` - Full workflow
- `export performance: large dataset handling` - Performance testing
- `sequential export downloads: verify file independence` - Download isolation
- `export with custom time ranges` - Multiple time range support

## Utilities

**analytics-export-helpers.ts** (96 LOC)
Shared Playwright helpers for analytics export testing:
- `parseCSV()` - Parse CSV content into records
- `navigateToDashboard()` - Dashboard navigation with retry logic
- `downloadFile()` - Download file from page
- `cleanupFile()` - Clean up temporary files
- `verifyFileContent()` - Verify file exists and has content
- `returnToDashboard()` - Return to dashboard after export

## Running Tests

### All analytics export tests
```bash
npx playwright test analytics-exports
```

### Specific module
```bash
# CSV export tests only
npx playwright test analytics-exports/csv-export

# Error handling tests only
npx playwright test analytics-exports/error-handling

# Data validation tests only
npx playwright test analytics-exports/data-validation
```

### With logging
```bash
npx playwright test analytics-exports --headed
npx playwright test analytics-exports --debug
```

### Generate HTML report
```bash
npx playwright test analytics-exports
npx playwright show-report
```

## Test Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| CSV Export | 3 | Format, structure, time ranges |
| PDF/Excel Export | 3 | Naming, file validation, formats |
| Data Validation | 4 | API responses, filtering, accuracy |
| Error Handling | 5 | Empty data, auth, timeout, invalid input |
| Download Flows | 5 | Full workflow, performance, ranges |
| **Total** | **20** | **Comprehensive** |

## Architecture

### Before Refactoring
- **File:** `analytics-exports.spec.ts` (601 LOC)
- **Issues:** Single file exceeds 300 LOC limit, mixed concerns

### After Refactoring
```
analytics-exports/
├── README.md (this file)
├── csv-export.spec.ts (137 LOC)
├── pdf-export.spec.ts (110 LOC)
├── data-validation.spec.ts (178 LOC)
├── error-handling.spec.ts (185 LOC)
└── download-flows.spec.ts (220 LOC)
```

**Utilities:**
```
__tests__/utils/playwright/
└── analytics-export-helpers.ts (96 LOC)
```

**Orchestrator:**
```
__tests__/playwright/dashboard/
└── analytics-exports.spec.ts (20 LOC) - imports all modules
```

## Key Testing Patterns

### Playwright Navigation
```typescript
await navigateToDashboard(page);  // Setup with retry logic
```

### File Download
```typescript
const result = await downloadFile(page, '/api/analytics/export?format=csv&days=7');
if (result) {
  // result.filePath, result.filename
  cleanupFile(result.filePath);  // Cleanup
}
```

### CSV Parsing
```typescript
const records = parseCSV(csvContent);
expect(records.length).toBeGreaterThan(0);
```

### Shared Setup
```typescript
test.beforeEach(async ({ page }) => {
  await navigateToDashboard(page);  // Reused across all tests
});
```

## Common Issues

### Downloads timing out
- Increase timeout: `waitForEvent('download', { timeout: 30000 })`
- Check network conditions in test environment

### Navigation failures
- Tests retry automatically via `navigateToDashboard()`
- Add `--headed` flag to debug navigation

### CSV parsing issues
- Verify comma-delimited format
- Check for quoted fields with commas: `"value, with, comma"`

### File cleanup
- Always call `cleanupFile()` in tests
- Check `/tmp` directory for leftover files

## Maintenance

### Adding New Tests
1. Identify which module (csv/pdf/data/error/download)
2. Add test case to appropriate spec file
3. Verify file stays under 300 LOC
4. Update this README with new test counts

### Module Split Decision
Current split by feature area ensures logical grouping:
- **csv-export**: CSV-specific functionality
- **pdf-export**: Multi-format validation (PDF, Excel)
- **data-validation**: Data accuracy and API contracts
- **error-handling**: Error scenarios and edge cases
- **download-flows**: Complete workflows and performance

Each module under 250 LOC with focused test cases.

### Updating Helpers
Edit `analytics-export-helpers.ts` to add new shared utilities:
- All helpers must be reusable across multiple test modules
- Keep helpers focused and single-purpose
- Update jsdoc comments with usage examples

## Performance Baselines

Tests include performance assertions:
- Large dataset (90 days) download: < 30 seconds
- File naming includes date pattern (YYYY-MM-DD)
- CSV structure validated with consistent columns
- Empty data handled gracefully (headers only)

## Future Enhancements

Potential areas for expansion:
- [ ] Export scheduling/automation tests
- [ ] Batch export operations
- [ ] Export history/audit trail
- [ ] Export format customization
- [ ] Email delivery of exports

## Related Documentation

- **Architecture:** [ARCHITECTURE_SEARCH_SYSTEM.md](../../../../docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- **Testing Guide:** [TESTING_E2E_TESTS.md](../../../../docs/05-TESTING/TESTING_E2E_TESTS.md)
- **Performance:** [REFERENCE_PERFORMANCE_OPTIMIZATION.md](../../../../docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)

## Last Updated
2025-11-10 - Initial refactoring from 601 LOC to modular structure

## Test Statistics

- **Total Test Cases:** 20
- **Total LOC (specs):** 830
- **Total LOC (helpers):** 96
- **Total LOC (combined):** 926
- **Average per module:** 165 LOC
- **Max file size:** 220 LOC (download-flows)
- **Min file size:** 110 LOC (pdf-export)
