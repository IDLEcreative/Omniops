# Database Cleanup Modules

**Purpose:** Modular components for the database cleanup CLI tool

**Status:** Active
**Last Updated:** 2025-11-10

## Modules

### `cli-helpers.ts` (82 LOC)
CLI utilities for user interaction:
- Help text display
- Countdown timer for safety
- Statistics and warning display
- Argument parsing

### `commands.ts` (43 LOC)
Command handlers:
- `handleStatsCommand()` - Display database statistics
- `handleCleanCommand()` - Execute cleanup with warnings and countdown

### `deletion-executor.ts` (116 LOC)
Core deletion logic:
- `executeCleanup()` - Orchestrates deletion operations
- `deleteFromTable()` - Deletes data from a specific table
- `safeDeleteFromTable()` - Graceful deletion with error handling
- `displayDeletionPreview()` - Shows what would be deleted

### `stats-query.ts` (66 LOC)
Statistics gathering:
- `getScrapingStats()` - Fetches counts from all relevant tables
- `countTable()` - Counts records in a table with optional domain filter
- `countCacheTable()` - Handles cache table counting (domain field instead of domain_id)
- `safeCountTable()` - Gracefully handles missing tables

## Usage

All modules work together to provide the CLI functionality:

1. Main script (`test-database-cleanup.ts`) parses arguments
2. CLI helpers format output and handle user interaction
3. Commands orchestrate stats queries or cleanup operations
4. Stats query retrieves database information
5. Deletion executor performs actual operations

## Related Files

- `__tests__/utils/database/types.ts` - Shared TypeScript interfaces
- `__tests__/utils/database/supabase-client.ts` - Supabase client factory
- `__tests__/utils/database/domain-helper.ts` - Domain lookup utilities
