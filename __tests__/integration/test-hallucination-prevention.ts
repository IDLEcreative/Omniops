#!/usr/bin/env npx tsx
/**
 * Hallucination Prevention Test Suite
 *
 * CLI entrypoint that parses arguments, verifies prerequisites, and delegates
 * execution to the modular hallucination testing runner.
 */

import { DEFAULT_DOMAIN } from './hallucination-prevention/config';
import { ensureServerIsAvailable } from './hallucination-prevention/client';
import { showHelp } from './hallucination-prevention/help';
import { runHallucinationTests } from './hallucination-prevention/runner';
import { RunOptions } from './hallucination-prevention/types';

interface CliOptions extends RunOptions {
  showHelp: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const domain =
    args.find((arg) => arg.startsWith('--domain='))?.split('=')[1] || DEFAULT_DOMAIN;
  const verbose = args.includes('--verbose') || args.includes('-v');
  const category = args.find((arg) => arg.startsWith('--category='))?.split('=')[1];
  const wantsHelp = args.includes('help') || args.includes('--help') || args.includes('-h');

  return {
    domain,
    verbose,
    category,
    showHelp: wantsHelp,
  };
}

async function main() {
  const cliOptions = parseArgs(process.argv.slice(2));

  if (cliOptions.showHelp) {
    showHelp();
    return;
  }

  try {
    await ensureServerIsAvailable();
  } catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    console.error('\nPlease start the server first:');
    console.error('  npm run dev\n');
    process.exit(1);
  }

  await runHallucinationTests({
    domain: cliOptions.domain,
    verbose: cliOptions.verbose,
    category: cliOptions.category,
  });
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
