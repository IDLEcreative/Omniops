#!/usr/bin/env npx tsx
import { loadExistingPaths } from './doc-code-validator/paths';
import { getDocumentationFiles, readFileContent, extractCodeBlocks } from './doc-code-validator/scanner';
import { validateCodeBlock } from './doc-code-validator/validators';
import { logSummary, writeReport } from './doc-code-validator/report';
import { createInitialStats, ValidationContext } from './doc-code-validator/types';

async function main() {
  console.log('📚 Documentation Code Example Validator\n');

  const context: ValidationContext = {
    issues: [],
    stats: createInitialStats(),
    existingPaths: loadExistingPaths()
  };

  console.log(`✓ Loaded ${context.existingPaths.size} code paths\n`);

  const files = getDocumentationFiles();
  context.stats.totalFiles = files.length;
  console.log(`✓ Found ${files.length} documentation files\n`);

  files.forEach(file => {
    const blocks = extractCodeBlocks(readFileContent(file), file);
    blocks.forEach(block => validateCodeBlock(context, block));
  });

  context.issues.forEach(issue => {
    if (issue.severity === 'critical') context.stats.criticalIssues++;
    else if (issue.severity === 'warning') context.stats.warnings++;
    else context.stats.info++;
  });

  logSummary(context.stats, context.issues);
  writeReport(context.stats, context.issues);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
