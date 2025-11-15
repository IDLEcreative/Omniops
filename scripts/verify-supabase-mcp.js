#!/usr/bin/env node

/**
 * Supabase MCP Verification CLI
 * Minimal CLI wrapper for Supabase MCP verification
 */

import chalk from 'chalk';
import dotenv from 'dotenv';
import {
  runDocumentationTests,
  runProjectManagementTests,
  runDatabaseOperationTests,
  runEdgeFunctionTests
} from '../lib/scripts/verify-supabase-mcp/testers.js';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN ?? process.env.SUPABASE_PERSONAL_ACCESS_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;

console.log(chalk.bold.cyan('\n🚀 SUPABASE MCP VERIFICATION REPORT\n'));
console.log(chalk.yellow('='.repeat(60)));

function printCategory(category) {
  console.log(chalk.bold.white(`\n${category.category}`));
  console.log(chalk.gray(`Status: ${category.status}`));
  console.log(chalk.gray('-'.repeat(40)));

  category.functions.forEach(func => {
    const symbol = func.ok === true ? '✅' : func.ok === null ? '⚠️' : '❌';
    console.log(`  ${symbol} ${chalk.cyan(func.name)}`);
    console.log(chalk.gray(`     ${func.description}`));
    if (func.notes) {
      console.log(chalk.yellow(`     Note: ${func.notes}`));
    }
  });
}

function summarise(categories) {
  return categories.reduce((acc, cat) => {
    cat.functions.forEach(fn => {
      if (fn.ok === true) acc.success++;
      else if (fn.ok === null) acc.skipped++;
      else acc.failed++;
    });
    return acc;
  }, { success: 0, failed: 0, skipped: 0 });
}

async function main() {
  const categories = [
    await runDocumentationTests(),
    await runProjectManagementTests(accessToken, projectRef),
    await runDatabaseOperationTests(accessToken, projectRef),
    await runEdgeFunctionTests(accessToken, projectRef)
  ];

  categories.forEach(printCategory);
  const totals = summarise(categories);

  console.log(chalk.yellow('\n' + '='.repeat(60)));
  console.log(chalk.bold.white('\n📊 SUMMARY\n'));
  console.log(chalk.green(`✅ Passed: ${totals.success}`));
  console.log(chalk.yellow(`⚠️  Skipped: ${totals.skipped}`));
  console.log(chalk.red(`❌ Failed: ${totals.failed}`));

  if (!accessToken) {
    console.log(chalk.yellow('\n⚠️  Missing SUPABASE_ACCESS_TOKEN — management API checks are skipped.'));
  }

  console.log(chalk.cyan('\n🔧 Non-destructive checks completed.\n'));
}

main().catch(error => {
  console.error(chalk.red('\n❌ Verification script failed:'), error);
  process.exitCode = 1;
});
