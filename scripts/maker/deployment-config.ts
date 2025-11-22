/**
 * MAKER Framework - Deployment Configuration
 *
 * @purpose Configuration for manual deployment tasks
 *
 * @flow
 *   1. Import deployment configurations
 *   2. → Use in manual deployment script
 *   3. → Return deployment file definitions
 *
 * @keyFunctions
 *   - TOP_3_FILES (line 46): Deployment file configurations
 *
 * @handles
 *   - Deployment file definitions
 *   - Microagent configurations
 *   - Cost estimates
 *
 * @returns Deployment configuration data
 *
 * @dependencies
 *   - ./display-utils.ts (DeploymentFile, MicroAgent types)
 *
 * @consumers
 *   - scripts/maker/manual-deployment.ts
 *
 * @totalLines 227
 * @estimatedTokens 850 (without header), 950 (with header - 11% savings)
 */

import { DeploymentFile } from './display-utils';

export const TOP_3_FILES: DeploymentFile[] = [
  {
    path: 'app/api/chat/route.ts',
    task: 'Clean up imports and remove unused',
    microagents: [
      {
        id: 'identify-imports',
        name: 'Identify All Imports',
        description: 'Scan file and list all import statements',
        prompt: `Read the file app/api/chat/route.ts and identify all import statements.

Output format (JSON):
{
  "imports": [
    { "line": 1, "statement": "import { NextRequest, NextResponse } from 'next/server'", "identifiers": ["NextRequest", "NextResponse"] },
    ...
  ],
  "totalCount": <number>
}

Be thorough and capture every import statement.`,
        verification: 'Manually count imports in file and compare',
        expectedTokens: 500,
        expectedSuccess: 0.99,
      },
      {
        id: 'detect-unused',
        name: 'Detect Unused Imports',
        description: 'Check which imports are actually used in the file',
        prompt: `For the file app/api/chat/route.ts, analyze which imported identifiers are actually used in the code.

For each import, search the file for usage of each identifier (excluding the import line itself).

Output format (JSON):
{
  "unusedImports": [
    { "line": 5, "identifier": "validateSupabaseEnv", "timesUsed": 0 },
    ...
  ],
  "usedImports": [
    { "line": 1, "identifier": "NextRequest", "timesUsed": 3 },
    ...
  ]
}

Be conservative - only flag as unused if you're confident it's not used.`,
        verification: 'Search file for each flagged identifier manually',
        expectedTokens: 800,
        expectedSuccess: 0.90,
      },
      {
        id: 'remove-unused',
        name: 'Remove Unused Imports',
        description: 'Delete or modify import statements to remove unused identifiers',
        prompt: `Based on the unused imports identified, generate the corrected import statements.

If an import statement has multiple identifiers and only some are unused, remove just those identifiers.
If an import statement has only unused identifiers, remove the entire line.

Output format (JSON):
{
  "changes": [
    { "line": 5, "action": "delete", "original": "import { validateSupabaseEnv } from '@/lib/supabase-server'" },
    { "line": 6, "action": "modify", "original": "import { ChatTelemetry, telemetryManager } from '@/lib/chat-telemetry'", "new": "import { telemetryManager } from '@/lib/chat-telemetry'" },
    ...
  ]
}

Only include changes for unused imports.`,
        verification: 'Check each change makes sense',
        expectedTokens: 600,
        expectedSuccess: 0.95,
      },
      {
        id: 'organize-imports',
        name: 'Organize Remaining Imports',
        description: 'Sort and group imports by category',
        prompt: `Organize the remaining imports in app/api/chat/route.ts into logical groups.

Groups (in order):
1. Next.js framework imports
2. Third-party libraries
3. Local modules (grouped by domain: lib/chat, lib/supabase, etc.)

Add blank lines between groups. Sort alphabetically within each group.

Output format (JSON):
{
  "organizedImports": [
    "// Next.js framework",
    "import { NextRequest, NextResponse } from 'next/server';",
    "",
    "// Telemetry",
    "import { telemetryManager } from '@/lib/chat-telemetry';",
    "",
    "// Chat modules",
    "import { processAIConversation } from '@/lib/chat/ai-processor';",
    ...
  ]
}`,
        verification: 'Check organization makes sense',
        expectedTokens: 700,
        expectedSuccess: 0.85,
      },
      {
        id: 'verify-compilation',
        name: 'Verify TypeScript Compilation',
        description: 'Ensure file still compiles without errors',
        prompt: `Verify that app/api/chat/route.ts will compile without TypeScript errors after the changes.

Check:
1. All used identifiers are still imported
2. No syntax errors
3. All imports resolve to valid modules

Output format (JSON):
{
  "compilationSuccess": true/false,
  "errors": [...],
  "warnings": [...]
}`,
        verification: 'Run: npx tsc --noEmit app/api/chat/route.ts',
        expectedTokens: 400,
        expectedSuccess: 0.99,
      },
    ],
    estimatedCost: { traditional: 0.0345, maker: 0.0017 },
    estimatedTime: { traditional: 15, maker: 4 },
  },
  {
    path: 'app/api/dashboard/analytics/route.ts',
    task: 'Clean up imports and remove unused',
    microagents: [
      {
        id: 'identify-imports',
        name: 'Identify All Imports',
        description: 'Scan file and list all import statements',
        prompt: 'Read app/api/dashboard/analytics/route.ts and identify all imports...',
        verification: 'Manually count imports',
        expectedTokens: 500,
        expectedSuccess: 0.99,
      },
      {
        id: 'detect-unused',
        name: 'Detect Unused Imports',
        description: 'Check which imports are used',
        prompt: 'Analyze app/api/dashboard/analytics/route.ts for unused imports...',
        verification: 'Search file for identifiers',
        expectedTokens: 800,
        expectedSuccess: 0.90,
      },
      {
        id: 'remove-unused',
        name: 'Remove Unused Imports',
        description: 'Delete unused import statements',
        prompt: 'Generate corrected imports for app/api/dashboard/analytics/route.ts...',
        verification: 'Check changes',
        expectedTokens: 600,
        expectedSuccess: 0.95,
      },
      {
        id: 'organize-imports',
        name: 'Organize Remaining Imports',
        description: 'Sort and group imports',
        prompt: 'Organize imports in app/api/dashboard/analytics/route.ts...',
        verification: 'Check organization',
        expectedTokens: 700,
        expectedSuccess: 0.85,
      },
      {
        id: 'verify-compilation',
        name: 'Verify TypeScript Compilation',
        description: 'Ensure compilation succeeds',
        prompt: 'Verify app/api/dashboard/analytics/route.ts compiles...',
        verification: 'Run tsc',
        expectedTokens: 400,
        expectedSuccess: 0.99,
      },
    ],
    estimatedCost: { traditional: 0.0310, maker: 0.0016 },
    estimatedTime: { traditional: 15, maker: 4 },
  },
  {
    path: 'app/api/dashboard/telemetry/types.ts',
    task: 'Extract type definitions to separate file (if beneficial)',
    microagents: [
      {
        id: 'analyze-types',
        name: 'Analyze Type Definitions',
        description: 'Identify all type/interface definitions in file',
        prompt: `Read app/api/dashboard/telemetry/types.ts and identify all type/interface definitions.

Output format (JSON):
{
  "types": [
    { "line": 10, "name": "TelemetryEvent", "kind": "interface" },
    { "line": 25, "name": "MetricData", "kind": "type" },
    ...
  ],
  "totalCount": <number>
}`,
        verification: 'Count type definitions manually',
        expectedTokens: 500,
        expectedSuccess: 0.99,
      },
      {
        id: 'check-extraction-benefit',
        name: 'Check Extraction Benefit',
        description: 'Determine if extraction would improve organization',
        prompt: `Analyze if extracting type definitions from app/api/dashboard/telemetry/types.ts would be beneficial.

Consider:
1. Is file already well-organized as a types file?
2. Are types used across multiple modules?
3. Would extraction reduce duplication?

Output format (JSON):
{
  "shouldExtract": true/false,
  "reason": "...",
  "recommendedAction": "..."
}`,
        verification: 'Review reasoning',
        expectedTokens: 600,
        expectedSuccess: 0.90,
      },
      {
        id: 'extract-shared-types',
        name: 'Extract Shared Types (if needed)',
        description: 'Move shared types to types/ directory',
        prompt: `If extraction is beneficial, generate new types file structure.

Output format (JSON):
{
  "newFile": "types/telemetry.ts",
  "content": "...",
  "updatedOriginal": "...",
  "importsToAdd": [...]
}

If extraction not needed, return { "noActionNeeded": true }`,
        verification: 'Check proposed structure',
        expectedTokens: 800,
        expectedSuccess: 0.85,
      },
      {
        id: 'verify-types',
        name: 'Verify Type Compilation',
        description: 'Ensure types still work after changes',
        prompt: `Verify type definitions compile correctly.

Output format (JSON):
{
  "compilationSuccess": true/false,
  "errors": [...]
}`,
        verification: 'Run tsc',
        expectedTokens: 400,
        expectedSuccess: 0.99,
      },
    ],
    estimatedCost: { traditional: 0.0331, maker: 0.0017 },
    estimatedTime: { traditional: 12, maker: 4 },
  },
];
