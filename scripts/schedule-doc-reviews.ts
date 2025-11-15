#!/usr/bin/env tsx
/**
 * Automated Documentation Review Scheduler CLI
 *
 * Checks if documentation reviews are due and sends notifications.
 * Business logic extracted to lib/scripts/schedule-doc-reviews/core.ts
 */

import { DocumentationReviewScheduler } from '../lib/scripts/schedule-doc-reviews/core';

const args = process.argv.slice(2);
const options: { checkOnly?: boolean; force?: boolean } = {};

for (const arg of args) {
  if (arg === '--check') {
    options.checkOnly = true;
  } else if (arg === '--force') {
    options.force = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Documentation Review Scheduler

Usage:
  npx tsx scripts/schedule-doc-reviews.ts [options]

Options:
  --check      Check only (don't send notifications)
  --force      Force notifications (for testing)
  --help, -h   Show this help message

Examples:
  # Check if reviews are due and send notifications
  npx tsx scripts/schedule-doc-reviews.ts

  # Check only (no notifications)
  npx tsx scripts/schedule-doc-reviews.ts --check

  # Force notifications (testing)
  npx tsx scripts/schedule-doc-reviews.ts --force

Add to crontab for daily checks:
  0 9 * * * cd /path/to/project && npx tsx scripts/schedule-doc-reviews.ts
`);
    process.exit(0);
  }
}

const scheduler = new DocumentationReviewScheduler(options);
scheduler.run().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
