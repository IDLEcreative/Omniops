/**
 * Markdown Generator
 * Generates human-readable markdown knowledge base
 */

import { AgentWorkflow } from './workflow-converter';
import { UICatalogEntry, APIReference, CommonPattern } from './catalog-builder';

export interface AgentKnowledge {
  workflows: AgentWorkflow[];
  uiCatalog: UICatalogEntry[];
  apiReference: APIReference[];
  commonPatterns: CommonPattern[];
  generatedAt: string;
}

/**
 * Generate human-readable markdown knowledge base
 */
export function generateMarkdownKnowledgeBase(knowledge: AgentKnowledge): string {
  let md = `# AI Agent Knowledge Base

**Generated:** ${knowledge.generatedAt}
**Purpose:** This document teaches AI agents how to operate the application autonomously

---

## 📚 How to Use This Guide

**For AI Agents:**
- Each workflow describes a complete user journey you can execute
- Preconditions tell you what must be true before starting
- Steps are ordered actions you should perform
- Success indicators tell you when you've succeeded
- Error recovery tells you how to handle failures

**For Humans:**
- This is auto-generated documentation of E2E tests
- Use it to understand user workflows
- Use it to train AI agents or automation scripts

---

## 🎯 Available Workflows (${knowledge.workflows.length})

`;

  knowledge.workflows.slice(0, 10).forEach((wf, idx) => {
    md += `### ${idx + 1}. ${wf.name}\n\n`;
    md += `**Intent:** ${wf.intent}\n\n`;

    md += `**Preconditions:**\n`;
    wf.preconditions.forEach(pre => md += `- ${pre}\n`);
    md += '\n';

    md += `**Steps (${wf.steps.length}):**\n\n`;
    wf.steps.slice(0, 8).forEach(step => {
      md += `${step.order}. **${step.intent}**\n`;
      md += `   - Action: \`${step.action}\`\n`;
      if (step.target) md += `   - Target: \`${step.target}\`\n`;
      if (step.value) md += `   - Value: \`${step.value}\`\n`;
      md += `   - Expected: ${step.expectedResult}\n\n`;
    });

    if (wf.steps.length > 8) {
      md += `   ... ${wf.steps.length - 8} more steps\n\n`;
    }

    md += `**Success Indicators:**\n`;
    wf.successIndicators.slice(0, 3).forEach(ind => md += `- ✅ ${ind}\n`);
    md += '\n';

    md += `**Error Recovery:**\n`;
    wf.errorRecovery.forEach(rec => md += `- ⚠️ ${rec}\n`);
    md += '\n---\n\n';
  });

  if (knowledge.workflows.length > 10) {
    md += `... ${knowledge.workflows.length - 10} more workflows available in JSON export\n\n`;
  }

  md += `## 🎨 UI Element Catalog (${knowledge.uiCatalog.length})\n\n`;
  md += 'Common UI elements you will interact with:\n\n';

  knowledge.uiCatalog.slice(0, 20).forEach(el => {
    md += `### ${el.semanticName}\n`;
    md += `- **Selector:** \`${el.selector}\`\n`;
    md += `- **Purpose:** ${el.purpose}\n`;
    md += `- **Interaction:** ${el.interactionType}\n`;
    md += `- **Used in:** ${el.usedInWorkflows.length} workflow(s)\n\n`;
  });

  md += `\n## 🔌 API Reference (${knowledge.apiReference.length})\n\n`;

  knowledge.apiReference.forEach(api => {
    md += `### \`${api.endpoint}\`\n`;
    md += `- **Purpose:** ${api.purpose}\n`;
    md += `- **Used in:** ${api.usedInWorkflows.join(', ')}\n\n`;
  });

  md += `\n## 🔄 Common Patterns\n\n`;

  knowledge.commonPatterns.forEach((pattern, idx) => {
    md += `### ${idx + 1}. ${pattern.name} (${pattern.frequency} uses)\n`;
    md += `${pattern.description}\n\n`;
    md += `**Example:**\n\`\`\`typescript\n${pattern.example}\n\`\`\`\n\n`;
  });

  return md;
}
