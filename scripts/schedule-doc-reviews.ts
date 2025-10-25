#!/usr/bin/env tsx
/**
 * Automated Documentation Review Scheduler
 *
 * Checks if documentation reviews are due and sends notifications
 * Run daily via cron: 0 9 * * * npx tsx scripts/schedule-doc-reviews.ts
 *
 * Usage:
 *   npx tsx scripts/schedule-doc-reviews.ts          # Check and notify
 *   npx tsx scripts/schedule-doc-reviews.ts --check  # Check only (no notifications)
 *   npx tsx scripts/schedule-doc-reviews.ts --force  # Force notifications (testing)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

interface ReviewSchedule {
  type: 'monthly' | 'quarterly' | 'annual';
  dueDate: Date;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

class DocumentationReviewScheduler {
  private rootDir: string;
  private today: Date;
  private checkOnly: boolean;
  private force: boolean;

  constructor(options: { checkOnly?: boolean; force?: boolean } = {}) {
    this.rootDir = path.resolve(__dirname, '..');
    this.today = new Date();
    this.checkOnly = options.checkOnly || false;
    this.force = options.force || false;
  }

  /**
   * Main execution
   */
  async run(): Promise<void> {
    console.log(`${colors.cyan}📅 Documentation Review Scheduler${colors.reset}`);
    console.log(`${colors.gray}Date: ${this.today.toISOString().split('T')[0]}${colors.reset}\n`);

    const dueReviews = this.checkDueReviews();

    if (dueReviews.length === 0 && !this.force) {
      console.log(`${colors.green}✅ No documentation reviews due today${colors.reset}\n`);
      // Still display upcoming reviews even if nothing due today
      this.displayUpcomingReviews();
      return;
    }

    if (this.force) {
      console.log(`${colors.yellow}⚠️  Force mode: Sending test notifications${colors.reset}\n`);
      // Create test reviews for all types
      dueReviews.push({
        type: 'monthly',
        dueDate: this.today,
        message: 'TEST: Monthly documentation review',
        priority: 'medium',
      });
    }

    // Display due reviews
    for (const review of dueReviews) {
      this.displayReview(review);
    }

    // Send notifications
    if (!this.checkOnly) {
      for (const review of dueReviews) {
        await this.sendNotifications(review);
      }
    } else {
      console.log(`${colors.gray}Check-only mode: Skipping notifications${colors.reset}\n`);
    }

    // Display next scheduled reviews
    this.displayUpcomingReviews();
  }

  /**
   * Check if any reviews are due today
   */
  private checkDueReviews(): ReviewSchedule[] {
    const dueReviews: ReviewSchedule[] = [];

    const dayOfMonth = this.today.getDate();
    const month = this.today.getMonth() + 1; // 1-12
    const dayOfWeek = this.today.getDay(); // 0 = Sunday, 1 = Monday

    // Check for monthly review (first Monday of month)
    if (this.isFirstMondayOfMonth()) {
      dueReviews.push({
        type: 'monthly',
        dueDate: this.today,
        message: 'Monthly documentation review due today',
        priority: 'medium',
      });
    }

    // Check for quarterly review (first day of quarter: Jan 1, Apr 1, Jul 1, Oct 1)
    if (dayOfMonth === 1 && [1, 4, 7, 10].includes(month)) {
      const quarter = Math.floor((month - 1) / 3) + 1;
      dueReviews.push({
        type: 'quarterly',
        dueDate: this.today,
        message: `Q${quarter} quarterly documentation review starts today`,
        priority: 'high',
      });
    }

    // Check for annual audit (December 1 - 14 day warning)
    if (month === 12 && dayOfMonth === 1) {
      dueReviews.push({
        type: 'annual',
        dueDate: new Date(this.today.getFullYear(), 11, 15), // December 15
        message: 'Annual documentation audit scheduled in 2 weeks (December 15-17)',
        priority: 'high',
      });
    }

    // Check for annual audit start (December 15)
    if (month === 12 && dayOfMonth === 15) {
      dueReviews.push({
        type: 'annual',
        dueDate: this.today,
        message: 'Annual documentation audit starts today (3 days: Dec 15-17)',
        priority: 'high',
      });
    }

    return dueReviews;
  }

  /**
   * Check if today is the first Monday of the month
   */
  private isFirstMondayOfMonth(): boolean {
    const dayOfWeek = this.today.getDay();
    const dayOfMonth = this.today.getDate();

    // Monday = 1, and day of month is 1-7
    return dayOfWeek === 1 && dayOfMonth <= 7;
  }

  /**
   * Display a review that's due
   */
  private displayReview(review: ReviewSchedule): void {
    const priorityColor = {
      high: colors.red,
      medium: colors.yellow,
      low: colors.gray,
    };

    const typeEmoji = {
      monthly: '📋',
      quarterly: '📚',
      annual: '🎯',
    };

    console.log(`${typeEmoji[review.type]} ${priorityColor[review.priority]}${review.message.toUpperCase()}${colors.reset}`);
    console.log(`   Priority: ${priorityColor[review.priority]}${review.priority}${colors.reset}`);
    console.log(`   Type: ${review.type}`);
    console.log(`   Due: ${review.dueDate.toISOString().split('T')[0]}\n`);

    // Display specific instructions
    switch (review.type) {
      case 'monthly':
        console.log(`   ${colors.cyan}Tasks:${colors.reset}`);
        console.log(`   1. Run: ${colors.green}npx tsx scripts/audit-doc-versions.ts --report${colors.reset}`);
        console.log(`   2. Review 10 critical documents`);
        console.log(`   3. Update "Last Updated" dates`);
        console.log(`   4. Test code examples`);
        console.log(`   5. Fix broken links`);
        console.log(`   6. Commit updates\n`);
        console.log(`   ${colors.gray}Estimated time: 2-4 hours${colors.reset}\n`);
        break;

      case 'quarterly':
        console.log(`   ${colors.cyan}Tasks:${colors.reset}`);
        console.log(`   1. Review all feature documentation (50+ docs)`);
        console.log(`   2. Update code examples and screenshots`);
        console.log(`   3. Check external links`);
        console.log(`   4. Update API references`);
        console.log(`   5. Archive obsolete content`);
        console.log(`   6. Commit batch updates\n`);
        console.log(`   ${colors.gray}Estimated time: 8-12 hours (1-2 days)${colors.reset}\n`);
        break;

      case 'annual':
        console.log(`   ${colors.cyan}Tasks:${colors.reset}`);
        console.log(`   1. Complete audit of all 400+ documentation files`);
        console.log(`   2. Analyze year-over-year metrics`);
        console.log(`   3. Plan improvements for next year`);
        console.log(`   4. Generate annual report\n`);
        console.log(`   ${colors.gray}Estimated time: 2-3 days${colors.reset}\n`);
        break;
    }

    console.log(`   ${colors.blue}See: docs/.metadata/DOCUMENTATION_MAINTENANCE_SCHEDULE.md${colors.reset}\n`);
    console.log('─────────────────────────────────────────────────────────────\n');
  }

  /**
   * Send notifications for a due review
   */
  private async sendNotifications(review: ReviewSchedule): Promise<void> {
    console.log(`${colors.cyan}Sending notifications...${colors.reset}\n`);

    // 1. Create GitHub issue (if in git repo)
    try {
      await this.createGitHubIssue(review);
    } catch (error) {
      console.log(`${colors.gray}GitHub issue creation skipped (not configured)${colors.reset}`);
    }

    // 2. Send Slack notification (if configured)
    try {
      await this.sendSlackNotification(review);
    } catch (error) {
      console.log(`${colors.gray}Slack notification skipped (not configured)${colors.reset}`);
    }

    // 3. Log to file
    this.logReview(review);

    console.log(`${colors.green}✅ Notifications sent${colors.reset}\n`);
  }

  /**
   * Create GitHub issue for review
   */
  private async createGitHubIssue(review: ReviewSchedule): Promise<void> {
    // Check if GitHub CLI is available
    try {
      execSync('which gh', { stdio: 'ignore' });
    } catch {
      return; // gh CLI not installed
    }

    const date = this.today.toISOString().split('T')[0];
    const month = this.today.toLocaleString('default', { month: 'long' });
    const year = this.today.getFullYear();

    let title = '';
    let body = '';
    let labels = ['documentation'];

    switch (review.type) {
      case 'monthly':
        title = `📋 Monthly Documentation Review - ${month} ${year}`;
        labels.push('monthly-review');
        body = `# Monthly Documentation Review - ${month} ${year}

**Due Date:** ${date}
**Status:** Pending

## Tasks
- [ ] Run: \`npx tsx scripts/audit-doc-versions.ts --report\`
- [ ] Review 10 critical documents
- [ ] Update "Last Updated" dates
- [ ] Test code examples
- [ ] Fix broken links
- [ ] Commit updates

**Estimated Time:** 2-4 hours

**See:** docs/.metadata/DOCUMENTATION_MAINTENANCE_SCHEDULE.md
`;
        break;

      case 'quarterly':
        const quarter = Math.floor((this.today.getMonth()) / 3) + 1;
        title = `📚 Quarterly Documentation Review - Q${quarter} ${year}`;
        labels.push('quarterly-review');
        body = `# Quarterly Documentation Review - Q${quarter} ${year}

**Due Date:** ${date}
**Status:** Pending

## Tasks
- [ ] Review all feature documentation (50+ docs)
- [ ] Update code examples and screenshots
- [ ] Check external links
- [ ] Update API references
- [ ] Archive obsolete content
- [ ] Commit batch updates

**Estimated Time:** 8-12 hours (1-2 days)

**See:** docs/.metadata/DOCUMENTATION_MAINTENANCE_SCHEDULE.md
`;
        break;

      case 'annual':
        title = `🎯 Annual Documentation Audit - ${year}`;
        labels.push('annual-audit', 'high-priority');
        body = `# Annual Documentation Audit - ${year}

**Scheduled:** December 15-17, ${year}
**Duration:** 3 days
**Team:** Full documentation team + senior developers

## Objectives
- Complete system audit of all 400+ documentation files
- Analyze year-over-year metrics
- Plan improvements for ${year + 1}
- Generate annual report

**See:** docs/.metadata/DOCUMENTATION_MAINTENANCE_SCHEDULE.md
`;
        break;
    }

    // Create issue via GitHub CLI
    const labelArgs = labels.map(l => `--label "${l}"`).join(' ');
    const command = `gh issue create --title "${title}" ${labelArgs} --body "${body.replace(/"/g, '\\"')}"`;

    try {
      execSync(command, { cwd: this.rootDir, stdio: 'inherit' });
      console.log(`${colors.green}✓ GitHub issue created${colors.reset}`);
    } catch (error) {
      // Ignore if gh is not authenticated or repo not configured
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(review: ReviewSchedule): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      return; // Slack not configured
    }

    const typeEmoji = {
      monthly: '📋',
      quarterly: '📚',
      annual: '🎯',
    };

    const message = {
      text: `${typeEmoji[review.type]} ${review.message}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${typeEmoji[review.type]} ${review.message}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Priority:* ${review.priority}\n*Type:* ${review.type}\n*Due:* ${review.dueDate.toISOString().split('T')[0]}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'See: `docs/.metadata/DOCUMENTATION_MAINTENANCE_SCHEDULE.md` for checklist',
          },
        },
      ],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        console.log(`${colors.green}✓ Slack notification sent${colors.reset}`);
      }
    } catch (error) {
      // Ignore Slack errors
    }
  }

  /**
   * Log review to file
   */
  private logReview(review: ReviewSchedule): void {
    const logDir = path.join(this.rootDir, 'docs', 'reports', 'review-logs');
    const logFile = path.join(logDir, `${this.today.getFullYear()}.md`);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = `
## ${review.type.charAt(0).toUpperCase() + review.type.slice(1)} Review - ${this.today.toISOString().split('T')[0]}

**Type:** ${review.type}
**Priority:** ${review.priority}
**Status:** Scheduled
**Message:** ${review.message}

---
`;

    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, `# Documentation Review Log - ${this.today.getFullYear()}\n\n`, 'utf-8');
    }

    fs.appendFileSync(logFile, logEntry, 'utf-8');
    console.log(`${colors.green}✓ Review logged to ${logFile}${colors.reset}`);
  }

  /**
   * Display upcoming reviews
   */
  private displayUpcomingReviews(): void {
    console.log(`${colors.cyan}📅 Upcoming Reviews${colors.reset}\n`);

    const upcoming = this.getUpcomingReviews(5);

    for (const review of upcoming) {
      const daysUntil = Math.ceil((review.dueDate.getTime() - this.today.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${colors.gray}${review.dueDate.toISOString().split('T')[0]}${colors.reset} - ${review.message} ${colors.gray}(in ${daysUntil} days)${colors.reset}`);
    }

    console.log('');
  }

  /**
   * Get next N upcoming reviews
   */
  private getUpcomingReviews(count: number): ReviewSchedule[] {
    const upcoming: ReviewSchedule[] = [];
    const currentDate = new Date(this.today);
    currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow

    // Look ahead 365 days
    for (let i = 0; i < 365 && upcoming.length < count; i++) {
      const dayOfMonth = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const dayOfWeek = currentDate.getDay();

      // Check for first Monday (monthly review)
      if (dayOfWeek === 1 && dayOfMonth <= 7) {
        upcoming.push({
          type: 'monthly',
          dueDate: new Date(currentDate),
          message: 'Monthly documentation review',
          priority: 'medium',
        });
      }

      // Check for quarterly review
      if (dayOfMonth === 1 && [1, 4, 7, 10].includes(month)) {
        const quarter = Math.floor((month - 1) / 3) + 1;
        upcoming.push({
          type: 'quarterly',
          dueDate: new Date(currentDate),
          message: `Q${quarter} quarterly review`,
          priority: 'high',
        });
      }

      // Check for annual audit
      if (month === 12 && dayOfMonth === 15) {
        upcoming.push({
          type: 'annual',
          dueDate: new Date(currentDate),
          message: 'Annual documentation audit',
          priority: 'high',
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return upcoming.slice(0, count);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const options: {
  checkOnly?: boolean;
  force?: boolean;
} = {};

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

// Run scheduler
const scheduler = new DocumentationReviewScheduler(options);
scheduler.run().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
