import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export interface ReviewSchedule {
  type: 'monthly' | 'quarterly' | 'annual';
  dueDate: Date;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export class DocumentationReviewScheduler {
  private rootDir: string;
  private today: Date;
  private checkOnly: boolean;
  private force: boolean;

  constructor(options: { checkOnly?: boolean; force?: boolean } = {}) {
    this.rootDir = path.resolve(__dirname, '../../..');
    this.today = new Date();
    this.checkOnly = options.checkOnly || false;
    this.force = options.force || false;
  }

  async run(): Promise<void> {
    console.log(`${colors.cyan}📅 Documentation Review Scheduler${colors.reset}`);
    console.log(`${colors.gray}Date: ${this.today.toISOString().split('T')[0]}${colors.reset}\n`);

    const dueReviews = this.checkDueReviews();

    if (dueReviews.length === 0 && !this.force) {
      console.log(`${colors.green}✅ No documentation reviews due today${colors.reset}\n`);
      this.displayUpcomingReviews();
      return;
    }

    if (this.force) {
      console.log(`${colors.yellow}⚠️  Force mode: Sending test notifications${colors.reset}\n`);
      dueReviews.push({
        type: 'monthly',
        dueDate: this.today,
        message: 'TEST: Monthly documentation review',
        priority: 'medium',
      });
    }

    for (const review of dueReviews) {
      this.displayReview(review);
    }

    if (!this.checkOnly) {
      for (const review of dueReviews) {
        await this.sendNotifications(review);
      }
    } else {
      console.log(`${colors.gray}Check-only mode: Skipping notifications${colors.reset}\n`);
    }

    this.displayUpcomingReviews();
  }

  private checkDueReviews(): ReviewSchedule[] {
    const dueReviews: ReviewSchedule[] = [];
    const dayOfMonth = this.today.getDate();
    const month = this.today.getMonth() + 1;

    if (this.isFirstMondayOfMonth()) {
      dueReviews.push({
        type: 'monthly',
        dueDate: this.today,
        message: 'Monthly documentation review due today',
        priority: 'medium',
      });
    }

    if (dayOfMonth === 1 && [1, 4, 7, 10].includes(month)) {
      const quarter = Math.floor((month - 1) / 3) + 1;
      dueReviews.push({
        type: 'quarterly',
        dueDate: this.today,
        message: `Q${quarter} quarterly documentation review starts today`,
        priority: 'high',
      });
    }

    if (month === 12 && dayOfMonth === 1) {
      dueReviews.push({
        type: 'annual',
        dueDate: new Date(this.today.getFullYear(), 11, 15),
        message: 'Annual documentation audit scheduled in 2 weeks (December 15-17)',
        priority: 'high',
      });
    }

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

  private isFirstMondayOfMonth(): boolean {
    const dayOfWeek = this.today.getDay();
    const dayOfMonth = this.today.getDate();
    return dayOfWeek === 1 && dayOfMonth <= 7;
  }

  private displayReview(review: ReviewSchedule): void {
    const priorityColor = { high: colors.red, medium: colors.yellow, low: colors.gray };
    const typeEmoji = { monthly: '📋', quarterly: '📚', annual: '🎯' };

    console.log(`${typeEmoji[review.type]} ${priorityColor[review.priority]}${review.message.toUpperCase()}${colors.reset}`);
    console.log(`   Priority: ${priorityColor[review.priority]}${review.priority}${colors.reset}`);
    console.log(`   Type: ${review.type}`);
    console.log(`   Due: ${review.dueDate.toISOString().split('T')[0]}\n`);
    console.log(`   ${colors.blue}See: docs/.metadata/DOCUMENTATION_MAINTENANCE_SCHEDULE.md${colors.reset}\n`);
    console.log('─────────────────────────────────────────────────────────────\n');
  }

  private async sendNotifications(review: ReviewSchedule): Promise<void> {
    console.log(`${colors.cyan}Sending notifications...${colors.reset}\n`);

    try {
      await this.createGitHubIssue(review);
    } catch {
      console.log(`${colors.gray}GitHub issue creation skipped (not configured)${colors.reset}`);
    }

    try {
      await this.sendSlackNotification(review);
    } catch {
      console.log(`${colors.gray}Slack notification skipped (not configured)${colors.reset}`);
    }

    this.logReview(review);
    console.log(`${colors.green}✅ Notifications sent${colors.reset}\n`);
  }

  private async createGitHubIssue(review: ReviewSchedule): Promise<void> {
    try {
      execSync('which gh', { stdio: 'ignore' });
    } catch {
      return;
    }

    const date = this.today.toISOString().split('T')[0];
    const month = this.today.toLocaleString('default', { month: 'long' });
    const year = this.today.getFullYear();

    let title = '';
    let body = '';
    const labels = ['documentation'];

    if (review.type === 'monthly') {
      title = `📋 Monthly Documentation Review - ${month} ${year}`;
      labels.push('monthly-review');
      body = `# Monthly Documentation Review - ${month} ${year}\n**Due Date:** ${date}\n**Status:** Pending`;
    }

    const labelArgs = labels.map(l => `--label "${l}"`).join(' ');
    const command = `gh issue create --title "${title}" ${labelArgs} --body "${body.replace(/"/g, '\\"')}"`;

    try {
      execSync(command, { cwd: this.rootDir, stdio: 'inherit' });
      console.log(`${colors.green}✓ GitHub issue created${colors.reset}`);
    } catch {}
  }

  private async sendSlackNotification(review: ReviewSchedule): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    const typeEmoji = { monthly: '📋', quarterly: '📚', annual: '🎯' };
    const message = {
      text: `${typeEmoji[review.type]} ${review.message}`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `${typeEmoji[review.type]} ${review.message}` },
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
    } catch {}
  }

  private logReview(review: ReviewSchedule): void {
    const logDir = path.join(this.rootDir, 'docs', 'reports', 'review-logs');
    const logFile = path.join(logDir, `${this.today.getFullYear()}.md`);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = `\n## ${review.type.charAt(0).toUpperCase() + review.type.slice(1)} Review - ${this.today.toISOString().split('T')[0]}\n`;

    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, `# Documentation Review Log - ${this.today.getFullYear()}\n\n`, 'utf-8');
    }

    fs.appendFileSync(logFile, logEntry, 'utf-8');
    console.log(`${colors.green}✓ Review logged to ${logFile}${colors.reset}`);
  }

  private displayUpcomingReviews(): void {
    console.log(`${colors.cyan}📅 Upcoming Reviews${colors.reset}\n`);
    const upcoming = this.getUpcomingReviews(5);

    for (const review of upcoming) {
      const daysUntil = Math.ceil((review.dueDate.getTime() - this.today.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${colors.gray}${review.dueDate.toISOString().split('T')[0]}${colors.reset} - ${review.message} ${colors.gray}(in ${daysUntil} days)${colors.reset}`);
    }

    console.log('');
  }

  private getUpcomingReviews(count: number): ReviewSchedule[] {
    const upcoming: ReviewSchedule[] = [];
    const currentDate = new Date(this.today);
    currentDate.setDate(currentDate.getDate() + 1);

    for (let i = 0; i < 365 && upcoming.length < count; i++) {
      const dayOfMonth = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek === 1 && dayOfMonth <= 7) {
        upcoming.push({
          type: 'monthly',
          dueDate: new Date(currentDate),
          message: 'Monthly documentation review',
          priority: 'medium',
        });
      }

      if (dayOfMonth === 1 && [1, 4, 7, 10].includes(month)) {
        const quarter = Math.floor((month - 1) / 3) + 1;
        upcoming.push({
          type: 'quarterly',
          dueDate: new Date(currentDate),
          message: `Q${quarter} quarterly review`,
          priority: 'high',
        });
      }

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
