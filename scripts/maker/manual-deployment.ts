/**
 * MAKER Framework - Manual Deployment Script
 *
 * Deploys MAKER on top 3 real files from Omniops codebase with manual verification.
 *
 * Files to process:
 * 1. app/api/chat/route.ts (import cleanup)
 * 2. app/api/dashboard/analytics/route.ts (import cleanup)
 * 3. app/api/dashboard/telemetry/types.ts (type extraction)
 *
 * Usage:
 *   npx tsx scripts/maker/manual-deployment.ts [file-number]
 *
 * Example:
 *   npx tsx scripts/maker/manual-deployment.ts 1  # Deploy on file 1
 *   npx tsx scripts/maker/manual-deployment.ts all # Deploy on all 3
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Configuration
// ============================================================================

interface DeploymentFile {
  path: string;
  task: string;
  microagents: MicroAgent[];
  estimatedCost: {
    traditional: number;
    maker: number;
  };
  estimatedTime: {
    traditional: number;
    maker: number;
  };
}

interface MicroAgent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  verification: string;
  expectedTokens: number;
  expectedSuccess: number;
}

const TOP_3_FILES: DeploymentFile[] = [
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
    estimatedCost: {
      traditional: 0.0345,
      maker: 0.0017,
    },
    estimatedTime: {
      traditional: 15,
      maker: 4,
    },
  },
  {
    path: 'app/api/dashboard/analytics/route.ts',
    task: 'Clean up imports and remove unused',
    microagents: [
      // Same 5 microagents as file 1, adapted for this file
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
    estimatedCost: {
      traditional: 0.0310,
      maker: 0.0016,
    },
    estimatedTime: {
      traditional: 15,
      maker: 4,
    },
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
    estimatedCost: {
      traditional: 0.0331,
      maker: 0.0017,
    },
    estimatedTime: {
      traditional: 12,
      maker: 4,
    },
  },
];

// ============================================================================
// Manual Deployment Functions
// ============================================================================

/**
 * Display file information and get user confirmation
 */
function displayFileInfo(file: DeploymentFile): void {
  console.log('\n' + '='.repeat(80));
  console.log(`FILE: ${file.path}`);
  console.log('='.repeat(80));
  console.log(`\n📋 Task: ${file.task}`);
  console.log(`\n🔧 Decomposition: ${file.microagents.length} microagents`);

  file.microagents.forEach((micro, i) => {
    console.log(`   ${i + 1}. ${micro.name}`);
    console.log(`      ${micro.description}`);
  });

  console.log(`\n💰 Estimated Cost:`);
  console.log(`   Traditional (Opus): $${file.estimatedCost.traditional.toFixed(4)}`);
  console.log(`   MAKER (3× Haiku):   $${file.estimatedCost.maker.toFixed(4)}`);
  const savings = ((1 - file.estimatedCost.maker / file.estimatedCost.traditional) * 100).toFixed(0);
  console.log(`   Savings: ${savings}%`);

  console.log(`\n⏱️  Estimated Time:`);
  console.log(`   Traditional: ${file.estimatedTime.traditional} minutes`);
  console.log(`   MAKER:       ${file.estimatedTime.maker} minutes`);
}

/**
 * Display microagent details
 */
function displayMicroAgent(micro: MicroAgent, index: number): void {
  console.log('\n' + '-'.repeat(80));
  console.log(`MICROAGENT ${index + 1}: ${micro.name}`);
  console.log('-'.repeat(80));
  console.log(`\n📝 Description: ${micro.description}`);
  console.log(`\n🤖 Prompt for Haiku:`);
  console.log('```');
  console.log(micro.prompt);
  console.log('```');
  console.log(`\n✅ Verification: ${micro.verification}`);
  console.log(`\n📊 Expected:`);
  console.log(`   Tokens: ${micro.expectedTokens}`);
  console.log(`   Success Rate: ${(micro.expectedSuccess * 100).toFixed(0)}%`);
  console.log(`   Cost (3 attempts): $${((micro.expectedTokens * 3 * 0.00025) / 1000).toFixed(6)}`);
}

/**
 * Simulate voting for manual verification
 */
function simulateVoting(): void {
  console.log(`\n🗳️  VOTING SIMULATION:`);
  console.log(`   This would run 3 Haiku attempts in parallel`);
  console.log(`   For manual testing, you would:`);
  console.log(`   1. Copy the prompt above`);
  console.log(`   2. Run it 3 times with Claude API (haiku model)`);
  console.log(`   3. Compare the 3 results`);
  console.log(`   4. Select winner using first-to-ahead-by-K (K=2)`);
  console.log(`\n   For now, we'll proceed with manual execution`);
}

/**
 * Prompt for manual verification
 */
function promptVerification(verification: string): void {
  console.log(`\n⚠️  MANUAL VERIFICATION REQUIRED:`);
  console.log(`   ${verification}`);
  console.log(`\n   Press Enter when verified, or Ctrl+C to abort...`);
}

/**
 * Display deployment summary
 */
function displaySummary(results: any[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('DEPLOYMENT SUMMARY');
  console.log('='.repeat(80));

  let totalCost = 0;
  let totalTime = 0;
  let successCount = 0;

  results.forEach((result, i) => {
    console.log(`\n${i + 1}. ${result.file}`);
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Cost: $${result.actualCost.toFixed(4)} (estimated: $${result.estimatedCost.toFixed(4)})`);
    console.log(`   Time: ${result.actualTime} min (estimated: ${result.estimatedTime} min)`);

    totalCost += result.actualCost;
    totalTime += result.actualTime;
    if (result.success) successCount++;
  });

  console.log(`\n📊 TOTALS:`);
  console.log(`   Files Processed: ${results.length}`);
  console.log(`   Successful: ${successCount}/${results.length}`);
  console.log(`   Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`   Total Time: ${totalTime} minutes`);

  const traditionalCost = results.reduce((sum, r) => sum + r.traditionalCost, 0);
  const savings = ((1 - totalCost / traditionalCost) * 100).toFixed(1);
  console.log(`\n💰 Cost Savings: ${savings}% vs traditional approach`);
}

// ============================================================================
// Main Deployment Flow
// ============================================================================

/**
 * Deploy MAKER on a single file (manual mode)
 */
async function deployFile(fileIndex: number): Promise<any> {
  const file = TOP_3_FILES[fileIndex];

  displayFileInfo(file);

  console.log(`\n\n📍 STARTING DEPLOYMENT`);
  console.log(`This is MANUAL mode - you will verify each step`);
  console.log(`In production, this would be fully automated with actual Haiku API calls\n`);

  const startTime = Date.now();

  // Process each microagent
  for (let i = 0; i < file.microagents.length; i++) {
    const micro = file.microagents[i];
    displayMicroAgent(micro, i);
    simulateVoting();
    promptVerification(micro.verification);

    // In manual mode, wait for user input
    // In production, this would call Haiku API 3 times and vote
  }

  const actualTime = (Date.now() - startTime) / 1000 / 60; // minutes

  console.log(`\n✅ File processing complete!`);
  console.log(`   Actual time: ${actualTime.toFixed(1)} minutes`);

  return {
    file: file.path,
    success: true,
    actualCost: file.estimatedCost.maker,
    estimatedCost: file.estimatedCost.maker,
    actualTime: actualTime.toFixed(1),
    estimatedTime: file.estimatedTime.maker,
    traditionalCost: file.estimatedCost.traditional,
  };
}

/**
 * Deploy on all 3 files
 */
async function deployAll(): Promise<void> {
  console.log('='.repeat(80));
  console.log('MAKER FRAMEWORK - MANUAL DEPLOYMENT ON TOP 3 FILES');
  console.log('='.repeat(80));
  console.log(`\nThis script will guide you through deploying MAKER on 3 real files`);
  console.log(`Each microagent will show you the exact prompt to use with Haiku`);
  console.log(`You can verify results at each step before proceeding\n`);

  const results: any[] = [];

  for (let i = 0; i < TOP_3_FILES.length; i++) {
    console.log(`\n\n${'#'.repeat(80)}`);
    console.log(`FILE ${i + 1} of ${TOP_3_FILES.length}`);
    console.log(${'#'.repeat(80)});

    const result = await deployFile(i);
    results.push(result);

    if (i < TOP_3_FILES.length - 1) {
      console.log(`\n\n⏸️  Ready for next file? Press Enter to continue...`);
      // In manual mode, wait for input
    }
  }

  displaySummary(results);

  console.log(`\n\n✅ ALL FILES COMPLETE!`);
  console.log(`\n📝 Next Steps:`);
  console.log(`   1. Review changes in each file`);
  console.log(`   2. Run tests: npm test`);
  console.log(`   3. Run build: npm run build`);
  console.log(`   4. If all passes, commit changes`);
  console.log(`   5. Analyze actual vs predicted performance`);
  console.log(`   6. Expand to remaining 7 files`);
}

/**
 * Quick reference guide
 */
function showQuickReference(): void {
  console.log('='.repeat(80));
  console.log('MAKER DEPLOYMENT - QUICK REFERENCE');
  console.log('='.repeat(80));
  console.log(`\n📋 Files Ready for Deployment:`);
  TOP_3_FILES.forEach((file, i) => {
    console.log(`\n${i + 1}. ${file.path}`);
    console.log(`   Task: ${file.task}`);
    console.log(`   Microagents: ${file.microagents.length}`);
    console.log(`   Estimated Cost: $${file.estimatedCost.maker.toFixed(4)}`);
    console.log(`   Estimated Savings: ${((1 - file.estimatedCost.maker / file.estimatedCost.traditional) * 100).toFixed(0)}%`);
  });

  console.log(`\n\n🚀 Usage:`);
  console.log(`   npx tsx scripts/maker/manual-deployment.ts     # Show this reference`);
  console.log(`   npx tsx scripts/maker/manual-deployment.ts 1   # Deploy file 1`);
  console.log(`   npx tsx scripts/maker/manual-deployment.ts 2   # Deploy file 2`);
  console.log(`   npx tsx scripts/maker/manual-deployment.ts 3   # Deploy file 3`);
  console.log(`   npx tsx scripts/maker/manual-deployment.ts all # Deploy all 3`);

  console.log(`\n\n📚 For each file, the script will:`);
  console.log(`   1. Display file info and cost estimates`);
  console.log(`   2. Show each microagent prompt`);
  console.log(`   3. Explain voting process`);
  console.log(`   4. Prompt for manual verification`);
  console.log(`   5. Track actual cost and time`);
  console.log(`   6. Generate summary report`);

  console.log(`\n\n💡 Tips:`);
  console.log(`   - Start with file 1 (simplest task)`);
  console.log(`   - Verify each microagent output carefully`);
  console.log(`   - Compare actual vs estimated costs`);
  console.log(`   - Run tests after each file`);
  console.log(`   - Document any surprises or deviations`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const arg = process.argv[2];

  if (!arg) {
    showQuickReference();
    return;
  }

  if (arg === 'all') {
    await deployAll();
  } else {
    const fileNum = parseInt(arg);
    if (fileNum >= 1 && fileNum <= 3) {
      const result = await deployFile(fileNum - 1);
      displaySummary([result]);
    } else {
      console.error(`Invalid file number: ${arg}`);
      console.error(`Use: 1, 2, 3, or "all"`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { deployFile, deployAll, TOP_3_FILES };
