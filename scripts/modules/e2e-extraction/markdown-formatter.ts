/**
 * Markdown Formatter
 * Generates markdown documentation from extracted workflows
 */

import { Workflow } from './typescript-parser';

export interface ExtractionResult {
  workflows: Workflow[];
  totalTests: number;
  totalSteps: number;
  coverage: {
    apiEndpoints: Set<string>;
    uiElements: Set<string>;
  };
}

/**
 * Generate markdown documentation from extracted workflows
 */
export function generateMarkdownDocs(result: ExtractionResult): string {
  const { workflows, totalTests, totalSteps, coverage } = result;

  let markdown = `# Application Workflows (Auto-Generated from E2E Tests)

**Generated:** ${new Date().toISOString()}
**Source:** Playwright E2E test files in \`__tests__/playwright/\`

## Summary

- **Total Tests:** ${totalTests}
- **Total Steps:** ${totalSteps}
- **API Endpoints Documented:** ${coverage.apiEndpoints.size}
- **UI Elements Documented:** ${coverage.uiElements.size}

---

## Table of Contents

`;

  workflows.forEach((wf, idx) => {
    markdown += `${idx + 1}. [${wf.testName}](#${slugify(wf.testName)})\n`;
  });

  markdown += '\n---\n\n';

  workflows.forEach((wf, idx) => {
    markdown += `## ${idx + 1}. ${wf.testName}\n\n`;
    markdown += `**Source:** [\`${wf.testFile}\`](/${wf.testFile})\n\n`;

    if (wf.description) {
      markdown += `**Description:**\n${wf.description}\n\n`;
    }

    markdown += `**Total Steps:** ${wf.totalSteps}\n\n`;

    if (wf.apiEndpoints.length > 0) {
      markdown += `**API Endpoints Used:**\n`;
      wf.apiEndpoints.forEach(ep => {
        markdown += `- \`${ep}\`\n`;
      });
      markdown += '\n';
    }

    markdown += '**Workflow Steps:**\n\n';
    markdown += '| Step | Action | Target | Value | Expected Outcome |\n';
    markdown += '|------|--------|--------|-------|------------------|\n';

    wf.steps.forEach(step => {
      const stepNum = step.stepNumber || '';
      const action = step.action || '';
      const target = step.target ? `\`${step.target}\`` : '';
      const value = step.value ? `\`${step.value}\`` : '';
      const outcome = step.expectedOutcome ? step.expectedOutcome.substring(0, 100) : '';

      markdown += `| ${stepNum} | ${action} | ${target} | ${value} | ${outcome} |\n`;
    });

    markdown += '\n**Code Reference:**\n\n```typescript\n';
    wf.steps.slice(0, 10).forEach(step => {
      markdown += `// Line ${step.lineNumber}\n${step.code}\n\n`;
    });
    if (wf.steps.length > 10) {
      markdown += `// ... ${wf.steps.length - 10} more steps ...\n`;
    }
    markdown += '```\n\n';

    markdown += '---\n\n';
  });

  markdown += '## Coverage Summary\n\n';
  markdown += '### API Endpoints\n\n';
  Array.from(coverage.apiEndpoints).sort().forEach(ep => {
    markdown += `- \`${ep}\`\n`;
  });

  markdown += '\n### UI Elements\n\n';
  markdown += '<details>\n<summary>Click to expand UI element catalog</summary>\n\n';
  Array.from(coverage.uiElements).sort().forEach(el => {
    markdown += `- \`${el}\`\n`;
  });
  markdown += '\n</details>\n\n';

  markdown += '---\n\n';
  markdown += '**Note:** This document is auto-generated from E2E tests. ';
  markdown += 'To update, run `npx tsx scripts/extract-workflows-from-e2e.ts`\n';

  return markdown;
}

/**
 * Convert string to slug for anchor links
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
