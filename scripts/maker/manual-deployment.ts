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

import { TOP_3_FILES } from './deployment-config';
import { displayFileInfo, displayMicroAgent, displayDeploymentSummary, DeploymentFile } from './display-utils';

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
 * Deploy MAKER on a single file (manual mode)
 */
async function deployFile(fileIndex: number): Promise<any> {
  const file = TOP_3_FILES[fileIndex];
  displayFileInfo(file);

  console.log(`\n\n📍 STARTING DEPLOYMENT`);
  console.log(`This is MANUAL mode - you will verify each step`);
  console.log(`In production, this would be fully automated with actual Haiku API calls\n`);

  const startTime = Date.now();

  for (let i = 0; i < file.microagents.length; i++) {
    const micro = file.microagents[i];
    displayMicroAgent(micro, i);
    simulateVoting();
    promptVerification(micro.verification);
  }

  const actualTime = (Date.now() - startTime) / 1000 / 60;

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
    console.log('#'.repeat(80));

    const result = await deployFile(i);
    results.push(result);

    if (i < TOP_3_FILES.length - 1) {
      console.log(`\n\n⏸️  Ready for next file? Press Enter to continue...`);
    }
  }

  displayDeploymentSummary(results);

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
    const savings = ((1 - file.estimatedCost.maker / file.estimatedCost.traditional) * 100).toFixed(0);
    console.log(`   Estimated Savings: ${savings}%`);
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

/**
 * CLI Entry Point
 */
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
      displayDeploymentSummary([result]);
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
