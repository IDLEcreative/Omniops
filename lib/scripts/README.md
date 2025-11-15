# Script Library Modules

This directory contains extracted logic from scripts/ tools, organized by tool name.

## Structure

```
lib/scripts/
├── verify-supabase-mcp/    # Supabase MCP verification logic
│   ├── validators.ts       # Validation & API helpers (150 LOC)
│   └── testers.ts          # Test runners (180 LOC)
├── monitor-embeddings/     # Embeddings health monitoring
│   └── health-checker.ts   # Health check logic (165 LOC)
├── optimize-data/          # Data optimization logic
│   ├── optimizer.ts        # Core optimization (190 LOC)
│   └── reporters.ts        # Report generation (95 LOC)
...
```

## Pattern

All scripts follow the **CLI Separation Pattern**:

1. **CLI Entrypoint** (`scripts/tool-name.ts` or `.js`) - <80 LOC
   - Argument parsing
   - Environment variable loading
   - Output formatting
   - Calls lib/scripts/[tool-name]/ modules

2. **Business Logic** (`lib/scripts/[tool-name]/*.ts`) - ≤200 LOC per module
   - Core functionality
   - Database operations
   - API calls
   - Computations

## Benefits

- ✅ Each module ≤200 LOC (easy to understand)
- ✅ Testable business logic (no CLI coupling)
- ✅ Reusable across different interfaces
- ✅ Clear separation of concerns

## Last Updated

2025-01-15 - Wave 10 LOC Refactoring Campaign
