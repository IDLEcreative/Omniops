/**
 * Agent Training Data Generator
 *
 * Converts extracted E2E workflows into AI-optimized training data that
 * agents can use to learn how to operate the application autonomously.
 *
 * Usage:
 *   npx tsx scripts/generate-agent-training-data.ts
 *
 * Outputs:
 *   docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md - Human-readable guide
 *   docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.json - Machine-readable data
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractWorkflows } from './modules/agent-training/workflow-extractor';
import { convertToAgentWorkflow } from './modules/agent-training/workflow-converter';
import { buildUICatalog, buildAPIReference, identifyCommonPatterns } from './modules/agent-training/catalog-builder';
import { generateMarkdownKnowledgeBase, type AgentKnowledge } from './modules/agent-training/markdown-generator';

/**
 * Main generation function
 */
async function generateAgentTrainingData(): Promise<AgentKnowledge> {
  console.log('🤖 Generating AI Agent Training Data...\n');

  const workflowsPath = path.join(process.cwd(), 'docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md');

  if (!fs.existsSync(workflowsPath)) {
    console.error('❌ Workflows file not found. Run extract-workflows-from-e2e.ts first.');
    process.exit(1);
  }

  const workflows = await extractWorkflows();

  console.log(`📄 Processing ${workflows.length} workflows\n`);

  const agentWorkflows = workflows.map(convertToAgentWorkflow);
  const uiCatalog = buildUICatalog(workflows);
  const apiReference = buildAPIReference(workflows);
  const commonPatterns = identifyCommonPatterns(workflows);

  const knowledge: AgentKnowledge = {
    workflows: agentWorkflows,
    uiCatalog,
    apiReference,
    commonPatterns,
    generatedAt: new Date().toISOString()
  };

  console.log('✅ Generated:');
  console.log(`   ${agentWorkflows.length} agent workflows`);
  console.log(`   ${uiCatalog.length} UI elements`);
  console.log(`   ${apiReference.length} API endpoints`);
  console.log(`   ${commonPatterns.length} common patterns\n`);

  return knowledge;
}

/**
 * Main execution
 */
async function main() {
  const knowledge = await generateAgentTrainingData();

  const jsonPath = path.join(process.cwd(), 'docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.json');
  fs.writeFileSync(jsonPath, JSON.stringify(knowledge, null, 2), 'utf-8');
  console.log(`✅ JSON data: ${jsonPath}`);

  const markdown = generateMarkdownKnowledgeBase(knowledge);
  const mdPath = path.join(process.cwd(), 'docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md');
  fs.writeFileSync(mdPath, markdown, 'utf-8');
  console.log(`✅ Markdown guide: ${mdPath}\n`);

  console.log('🎉 Agent training data generation complete!\n');
  console.log('📖 AI agents can now learn from:');
  console.log(`   - ${knowledge.workflows.length} executable workflows`);
  console.log(`   - ${knowledge.uiCatalog.length} UI element definitions`);
  console.log(`   - ${knowledge.apiReference.length} API endpoints`);
  console.log(`   - ${knowledge.commonPatterns.length} interaction patterns\n`);
}

main().catch(console.error);
