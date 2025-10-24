#!/usr/bin/env tsx
/**
 * Documentation Code Example Validator
 *
 * Scans all markdown files for code blocks and validates:
 * - Syntax correctness
 * - Import/reference accuracy
 * - Command validity
 * - SQL correctness
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface CodeBlock {
  file: string;
  language: string;
  code: string;
  lineNumber: number;
}

interface ValidationIssue {
  file: string;
  language: string;
  lineNumber: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  code: string;
}

const issues: ValidationIssue[] = [];
const stats = {
  totalFiles: 0,
  totalCodeBlocks: 0,
  byLanguage: {} as Record<string, number>,
  criticalIssues: 0,
  warnings: 0,
  info: 0,
};

// Files/paths that actually exist in the codebase
const existingPaths = new Set<string>();

function loadExistingPaths() {
  const patterns = [
    'lib/**/*.ts',
    'app/**/*.ts',
    'app/**/*.tsx',
    'components/**/*.tsx',
    'types/**/*.ts',
    '__tests__/**/*.ts',
    'scripts/**/*.ts',
  ];

  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    files.forEach(f => existingPaths.add(f));
  });
}

function extractCodeBlocks(content: string, filename: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let currentLanguage = '';
  let currentCode: string[] = [];
  let startLine = 0;

  lines.forEach((line, idx) => {
    const codeBlockMatch = line.match(/^```(\w+)?/);

    if (codeBlockMatch && !inCodeBlock) {
      inCodeBlock = true;
      currentLanguage = codeBlockMatch[1] || 'text';
      currentCode = [];
      startLine = idx + 1;
    } else if (line.startsWith('```') && inCodeBlock) {
      blocks.push({
        file: filename,
        language: currentLanguage,
        code: currentCode.join('\n'),
        lineNumber: startLine,
      });
      inCodeBlock = false;
      currentLanguage = '';
      currentCode = [];
    } else if (inCodeBlock) {
      currentCode.push(line);
    }
  });

  return blocks;
}

function validateTypeScriptBlock(block: CodeBlock) {
  const { code, file, lineNumber } = block;

  // Check for obvious syntax errors
  const syntaxChecks = [
    { pattern: /\bfunction\s+\w+\s*\([^)]*\)\s*\{[^}]*$/, message: 'Unclosed function body' },
    { pattern: /\bclass\s+\w+\s*\{[^}]*$/, message: 'Unclosed class body' },
    { pattern: /\(\s*\w+\s*:\s*[^)]*$/, message: 'Unclosed parameter list' },
    { pattern: /\[\s*[^\]]*$/, message: 'Unclosed array' },
    { pattern: /\{\s*[^}]*$/, message: 'Unclosed object' },
  ];

  syntaxChecks.forEach(({ pattern, message }) => {
    if (pattern.test(code.trim())) {
      issues.push({
        file,
        language: 'typescript',
        lineNumber,
        severity: 'warning',
        message,
        code: code.substring(0, 100),
      });
    }
  });

  // Check imports reference real files
  const importMatches = code.matchAll(/from\s+['"]([\w@\/.-]+)['"]/g);
  for (const match of importMatches) {
    const importPath = match[1];

    // Skip node_modules and external packages
    if (importPath.startsWith('@/') || importPath.startsWith('./') || importPath.startsWith('../')) {
      const cleanPath = importPath.replace('@/', '').replace(/^\.\//, '').replace(/^\.\.\//, '');
      const possiblePaths = [
        cleanPath + '.ts',
        cleanPath + '.tsx',
        cleanPath + '/index.ts',
        cleanPath + '/index.tsx',
      ];

      const exists = possiblePaths.some(p => existingPaths.has(p));
      if (!exists && !importPath.includes('...')) { // Skip placeholder imports
        issues.push({
          file,
          language: 'typescript',
          lineNumber,
          severity: 'warning',
          message: `Import path may not exist: ${importPath}`,
          code: match[0],
        });
      }
    }
  }

  // Check for common TypeScript mistakes
  if (code.includes('any') && !code.includes('// any is intentional')) {
    issues.push({
      file,
      language: 'typescript',
      lineNumber,
      severity: 'info',
      message: 'Use of "any" type - consider more specific type',
      code: code.substring(0, 100),
    });
  }

  // Check for incomplete code (common in examples)
  if (code.includes('// ...') || code.includes('/* ... */')) {
    // This is fine - it's a truncated example
  } else if (code.trim().endsWith(',')) {
    issues.push({
      file,
      language: 'typescript',
      lineNumber,
      severity: 'warning',
      message: 'Code block ends with comma - may be incomplete',
      code: code.substring(Math.max(0, code.length - 100)),
    });
  }
}

function validateBashBlock(block: CodeBlock) {
  const { code, file, lineNumber } = block;
  const lines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));

  lines.forEach(line => {
    // Check for npx tsx commands
    if (line.includes('npx tsx ')) {
      const scriptMatch = line.match(/npx tsx ([^\s]+)/);
      if (scriptMatch) {
        const scriptPath = scriptMatch[1];
        const fullPath = path.join(process.cwd(), scriptPath);
        if (!fs.existsSync(fullPath)) {
          issues.push({
            file,
            language: 'bash',
            lineNumber,
            severity: 'critical',
            message: `Script does not exist: ${scriptPath}`,
            code: line,
          });
        }
      }
    }

    // Check for common command mistakes
    if (line.includes('cd ') && line.includes('&&')) {
      issues.push({
        file,
        language: 'bash',
        lineNumber,
        severity: 'info',
        message: 'Using cd with && - consider using absolute paths instead',
        code: line,
      });
    }

    // Check for environment variables used without documentation
    const envVarMatches = line.matchAll(/\$\{?(\w+)\}?/g);
    for (const match of envVarMatches) {
      const envVar = match[1];
      // Skip common shell variables
      if (!['HOME', 'USER', 'PATH', 'PWD'].includes(envVar)) {
        issues.push({
          file,
          language: 'bash',
          lineNumber,
          severity: 'info',
          message: `Environment variable used: ${envVar} - ensure it's documented`,
          code: line,
        });
      }
    }
  });
}

function validateSQLBlock(block: CodeBlock) {
  const { code, file, lineNumber } = block;

  // Check for common SQL issues
  if (code.toLowerCase().includes('drop table') && !code.includes('IF EXISTS')) {
    issues.push({
      file,
      language: 'sql',
      lineNumber,
      severity: 'warning',
      message: 'DROP TABLE without IF EXISTS - could cause errors',
      code: code.substring(0, 100),
    });
  }

  // Check for potential SQL injection patterns
  if (code.includes('${') || code.includes('${') || code.includes('` +')) {
    issues.push({
      file,
      language: 'sql',
      lineNumber,
      severity: 'critical',
      message: 'Possible SQL injection vulnerability - use parameterized queries',
      code: code.substring(0, 100),
    });
  }

  // Check for SELECT * (anti-pattern)
  if (code.toLowerCase().includes('select *')) {
    issues.push({
      file,
      language: 'sql',
      lineNumber,
      severity: 'info',
      message: 'Using SELECT * - consider specifying columns',
      code: code.substring(0, 100),
    });
  }
}

function validateCodeBlock(block: CodeBlock) {
  stats.totalCodeBlocks++;
  stats.byLanguage[block.language] = (stats.byLanguage[block.language] || 0) + 1;

  switch (block.language.toLowerCase()) {
    case 'typescript':
    case 'ts':
    case 'tsx':
      validateTypeScriptBlock(block);
      break;
    case 'javascript':
    case 'js':
    case 'jsx':
      validateTypeScriptBlock(block); // Same checks apply
      break;
    case 'bash':
    case 'sh':
    case 'shell':
      validateBashBlock(block);
      break;
    case 'sql':
    case 'postgresql':
    case 'postgres':
      validateSQLBlock(block);
      break;
  }
}

async function main() {
  console.log('📚 Documentation Code Example Validator\n');
  console.log('Loading existing file paths...');
  loadExistingPaths();
  console.log(`✓ Loaded ${existingPaths.size} file paths\n`);

  console.log('Scanning documentation files...');
  const docFiles = glob.sync('docs/**/*.md', { cwd: process.cwd() });
  const readmeFiles = glob.sync('**/README.md', { cwd: process.cwd() });
  const allFiles = [...new Set([...docFiles, ...readmeFiles])];

  stats.totalFiles = allFiles.length;
  console.log(`✓ Found ${allFiles.length} documentation files\n`);

  console.log('Extracting and validating code blocks...');
  for (const file of allFiles) {
    const fullPath = path.join(process.cwd(), file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const blocks = extractCodeBlocks(content, file);

    blocks.forEach(validateCodeBlock);
  }

  // Count issues by severity
  issues.forEach(issue => {
    if (issue.severity === 'critical') stats.criticalIssues++;
    else if (issue.severity === 'warning') stats.warnings++;
    else stats.info++;
  });

  console.log('\n📊 Validation Results\n');
  console.log('═'.repeat(80));
  console.log(`Total Documentation Files: ${stats.totalFiles}`);
  console.log(`Total Code Blocks: ${stats.totalCodeBlocks}`);
  console.log('\nCode Blocks by Language:');
  Object.entries(stats.byLanguage)
    .sort(([, a], [, b]) => b - a)
    .forEach(([lang, count]) => {
      console.log(`  ${lang.padEnd(20)} ${count}`);
    });

  console.log('\n' + '═'.repeat(80));
  console.log(`🔴 Critical Issues: ${stats.criticalIssues}`);
  console.log(`🟡 Warnings: ${stats.warnings}`);
  console.log(`🔵 Info: ${stats.info}`);
  console.log(`📝 Total Issues: ${issues.length}`);
  console.log('═'.repeat(80));

  if (issues.length > 0) {
    console.log('\n🔍 Detailed Issues:\n');

    // Group by file
    const byFile = issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, ValidationIssue[]>);

    Object.entries(byFile).forEach(([file, fileIssues]) => {
      console.log(`\n📄 ${file}`);
      fileIssues.forEach(issue => {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
        console.log(`   ${icon} Line ${issue.lineNumber} [${issue.language}]`);
        console.log(`      ${issue.message}`);
        if (issue.code.length < 100) {
          console.log(`      Code: ${issue.code}`);
        }
      });
    });
  }

  // Write detailed report
  const reportPath = path.join(process.cwd(), 'DOC_CODE_VALIDATION_REPORT.md');
  const report = generateReport();
  fs.writeFileSync(reportPath, report);
  console.log(`\n✓ Detailed report written to: ${reportPath}`);
}

function generateReport(): string {
  let report = '# Documentation Code Example Validation Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += '## Summary\n\n';
  report += `- **Total Documentation Files**: ${stats.totalFiles}\n`;
  report += `- **Total Code Blocks**: ${stats.totalCodeBlocks}\n`;
  report += `- **Critical Issues**: ${stats.criticalIssues}\n`;
  report += `- **Warnings**: ${stats.warnings}\n`;
  report += `- **Info**: ${stats.info}\n\n`;

  report += '## Code Blocks by Language\n\n';
  report += '| Language | Count |\n';
  report += '|----------|-------|\n';
  Object.entries(stats.byLanguage)
    .sort(([, a], [, b]) => b - a)
    .forEach(([lang, count]) => {
      report += `| ${lang} | ${count} |\n`;
    });

  report += '\n## Issues by File\n\n';
  const byFile = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {} as Record<string, ValidationIssue[]>);

  Object.entries(byFile)
    .sort(([, a], [, b]) => {
      // Sort by critical issues first
      const aCritical = a.filter(i => i.severity === 'critical').length;
      const bCritical = b.filter(i => i.severity === 'critical').length;
      return bCritical - aCritical;
    })
    .forEach(([file, fileIssues]) => {
      report += `### ${file}\n\n`;
      fileIssues.forEach(issue => {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
        report += `${icon} **${issue.severity.toUpperCase()}** (Line ${issue.lineNumber}, ${issue.language})\n`;
        report += `- ${issue.message}\n`;
        if (issue.code.length < 200) {
          report += `- Code: \`${issue.code}\`\n`;
        }
        report += '\n';
      });
    });

  report += '## Recommendations\n\n';
  if (stats.criticalIssues > 0) {
    report += '### Critical Issues\n';
    report += 'These issues should be fixed immediately as they would prevent users from successfully using the code:\n\n';
    const criticals = issues.filter(i => i.severity === 'critical');
    criticals.forEach(issue => {
      report += `- **${issue.file}** (Line ${issue.lineNumber}): ${issue.message}\n`;
    });
    report += '\n';
  }

  if (stats.warnings > 0) {
    report += '### Warnings\n';
    report += 'These issues should be reviewed and potentially fixed:\n\n';
    report += `- ${stats.warnings} warnings found across ${Object.keys(byFile).length} files\n`;
    report += '- Review incomplete code examples\n';
    report += '- Verify all import paths are correct\n';
    report += '- Check SQL queries for safety\n\n';
  }

  report += '### General Recommendations\n\n';
  report += '1. **Complete Examples**: Ensure all code examples are complete and copy-paste ready\n';
  report += '2. **Import Accuracy**: Verify all imports reference actual files in the codebase\n';
  report += '3. **Type Safety**: Avoid using `any` type; use specific types\n';
  report += '4. **Error Handling**: Include error handling in examples where appropriate\n';
  report += '5. **Context**: Provide sufficient context for each code example\n';
  report += '6. **Testing**: Consider adding automated tests for critical code examples\n';

  return report;
}

main().catch(console.error);
