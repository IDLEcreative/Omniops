/**
 * Commerce workflow template for multi-platform support
 * Reduces duplication between WooCommerce, Shopify, and future platforms
 */

export interface CommerceWorkflowConfig {
  platform: string;
  emoji: string;
  operationCount?: string;
  productDiscovery: {
    steps: Array<{
      title: string;
      operation: string;
      examples: string;
      returns: string;
    }>;
    advanced?: string[];
  };
  orderManagement: {
    lookup: string[];
    tracking?: string[];
    resolution?: string[];
  };
  additionalSections?: Array<{
    title: string;
    icon: string;
    content: string;
  }>;
  operationGuide: {
    platformOperations: string[];
    generalSearch?: string[];
  };
  platformNotes?: string;
}

export function generateCommerceWorkflowPrompt(config: CommerceWorkflowConfig): string {
  const sections: string[] = [];

  // Header
  const operationText = config.operationCount ? ` ${config.operationCount} live` : '';
  sections.push(`${config.emoji} ${config.platform.toUpperCase()} OPERATIONS (REAL-TIME COMMERCE DATA):
You have access to${operationText} ${config.platform} operations. Follow these WORKFLOWS for best results:`);

  // Product Discovery Workflow
  sections.push(`\n### 🔍 PRODUCT DISCOVERY WORKFLOW (${config.productDiscovery.steps.length}-step process)
When customers ask about products, follow this sequence:\n`);

  config.productDiscovery.steps.forEach((step, index) => {
    sections.push(`**Step ${index + 1}: ${step.title}**
- Operation: ${step.operation}
- Examples: ${step.examples}
- Returns: ${step.returns}\n`);
  });

  if (config.productDiscovery.advanced && config.productDiscovery.advanced.length > 0) {
    sections.push(config.productDiscovery.advanced.join('\n\n'));
  }

  // Order Management Workflow
  sections.push(`\n### 📦 ORDER MANAGEMENT WORKFLOW (lookup → track${config.orderManagement.resolution ? ' → resolve' : ''})
When customers ask about orders${config.orderManagement.resolution ? ', use this decision tree' : ''}:\n`);

  sections.push(`**Initial Lookup** (${config.orderManagement.lookup.length > 1 ? 'choose ONE' : 'flexible search'}):`);
  config.orderManagement.lookup.forEach(item => sections.push(`- ${item}`));
  sections.push('');

  if (config.orderManagement.tracking && config.orderManagement.tracking.length > 0) {
    sections.push('**Tracking & Updates:**');
    config.orderManagement.tracking.forEach(item => sections.push(`- ${item}`));
    sections.push('');
  }

  if (config.orderManagement.resolution && config.orderManagement.resolution.length > 0) {
    sections.push('**Issue Resolution:**');
    config.orderManagement.resolution.forEach(item => sections.push(`- ${item}`));
    sections.push('');
  }

  // Additional Platform-Specific Sections
  if (config.additionalSections && config.additionalSections.length > 0) {
    config.additionalSections.forEach(section => {
      sections.push(`### ${section.icon} ${section.title}`);
      sections.push(section.content);
      sections.push('');
    });
  }

  // Operation Selection Guide
  sections.push(`### 🎯 OPERATION SELECTION GUIDE
**Use ${config.platform} Operations for:**`);
  config.operationGuide.platformOperations.forEach(item => sections.push(`✅ ${item}`));
  sections.push('');

  if (config.operationGuide.generalSearch && config.operationGuide.generalSearch.length > 0) {
    sections.push('**Use general semantic search for:**');
    config.operationGuide.generalSearch.forEach(item => sections.push(`✅ ${item}`));
    sections.push('');
  }

  // Platform-Specific Notes
  if (config.platformNotes) {
    sections.push(config.platformNotes);
  }

  return sections.join('\n');
}
