#!/usr/bin/env ts-node

/**
 * Documentation Link Validator
 *
 * Validates all markdown links across the documentation structure:
 * - Relative file paths
 * - Anchor links
 * - Cross-references
 * - Moved/deleted files
 *
 * Usage: npx tsx scripts/validate-doc-links.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface LinkInfo {
  source: string;
  target: string;
  text: string;
  line: number;
  isAnchor: boolean;
  isExternal: boolean;
}

interface ValidationResult {
  valid: LinkInfo[];
  broken: LinkInfo[];
  external: LinkInfo[];
  warnings: LinkInfo[];
}

const PROJECT_ROOT = '/Users/jamesguy/Omniops';

// Markdown link patterns
const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const ANCHOR_PATTERN = /#[a-z0-9\-_]+$/i;

function findAllMarkdownFiles(): string[] {
  const files = glob.sync('**/*.md', {
    cwd: PROJECT_ROOT,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
    ],
  });
  return files;
}

function extractLinks(filePath: string): LinkInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const links: LinkInfo[] = [];

  lines.forEach((line, index) => {
    let match;
    while ((match = LINK_PATTERN.exec(line)) !== null) {
      const [, text, target] = match;

      // Skip empty targets
      if (!target.trim()) continue;

      const isExternal = target.startsWith('http://') || target.startsWith('https://');
      const isAnchor = target.startsWith('#');

      links.push({
        source: filePath,
        target: target.trim(),
        text: text.trim(),
        line: index + 1,
        isAnchor,
        isExternal,
      });
    }
  });

  return links;
}

function resolveRelativePath(sourcePath: string, targetPath: string): string {
  const sourceDir = path.dirname(sourcePath);
  const resolved = path.resolve(sourceDir, targetPath);
  return resolved;
}

function validateLink(link: LinkInfo): { valid: boolean; reason?: string } {
  // External links - just catalog them
  if (link.isExternal) {
    return { valid: true };
  }

  // Anchor-only links (same page)
  if (link.isAnchor) {
    // Check if anchor exists in the source file
    const content = fs.readFileSync(link.source, 'utf-8');
    const anchorText = link.target.slice(1).toLowerCase();

    // GitHub anchor generation rules:
    // - Lowercase everything
    // - Replace spaces with hyphens
    // - Remove most punctuation
    // - Keep hyphens and numbers
    // - & becomes --
    // - Special emoji/unicode gets removed

    // Extract all headers and generate their anchors
    const headerMatches = content.matchAll(/^(#{1,6})\s+(.+)$/gm);
    const validAnchors = new Set<string>();

    for (const match of headerMatches) {
      const headerText = match[2];
      // Simulate GitHub's anchor generation
      let anchor = headerText
        .toLowerCase()
        .replace(/[^\w\s\-&]/g, '') // Remove special chars except word chars, spaces, hyphens, &
        .replace(/\s+/g, '-')        // Spaces to hyphens
        .replace(/&/g, '-')          // & to single hyphen (GitHub actually does this)
        .replace(/-+/g, '-')         // Multiple hyphens to single
        .trim();

      validAnchors.add(anchor);
    }

    if (validAnchors.has(anchorText)) {
      return { valid: true };
    }

    return { valid: false, reason: 'Anchor not found in source file' };
  }

  // Extract anchor from target if present
  let targetPath = link.target;
  let anchor = '';
  const anchorMatch = link.target.match(ANCHOR_PATTERN);
  if (anchorMatch) {
    anchor = anchorMatch[0];
    targetPath = link.target.replace(ANCHOR_PATTERN, '');
  }

  // Resolve relative path
  const resolvedPath = resolveRelativePath(link.source, targetPath);

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    return { valid: false, reason: 'File not found' };
  }

  // Check if it's a directory (should link to directory/README.md or similar)
  if (fs.statSync(resolvedPath).isDirectory()) {
    const readmePath = path.join(resolvedPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      return { valid: false, reason: 'Directory link without README.md' };
    }
  }

  // If anchor specified, check if it exists in target file
  if (anchor) {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const anchorText = anchor.slice(1).toLowerCase();
    const headerPattern = new RegExp(`^#{1,6}\\s+.*${anchorText.replace(/-/g, '\\s*')}.*$`, 'im');
    if (!content.match(headerPattern)) {
      return { valid: false, reason: `Anchor ${anchor} not found in target file` };
    }
  }

  return { valid: true };
}

function categorizeLink(link: LinkInfo, validation: { valid: boolean; reason?: string }): keyof ValidationResult {
  if (link.isExternal) return 'external';
  if (!validation.valid) return 'broken';
  if (link.target.includes('..') && link.target.split('..').length > 3) return 'warnings'; // Deep relative paths
  return 'valid';
}

function validateAllLinks(): ValidationResult {
  const result: ValidationResult = {
    valid: [],
    broken: [],
    external: [],
    warnings: [],
  };

  const files = findAllMarkdownFiles();
  console.log(`\n📄 Found ${files.length} markdown files\n`);

  let totalLinks = 0;

  for (const file of files) {
    const links = extractLinks(file);
    totalLinks += links.length;

    for (const link of links) {
      const validation = validateLink(link);
      const category = categorizeLink(link, validation);

      if (category === 'broken') {
        result.broken.push({
          ...link,
          text: validation.reason || 'Unknown error',
        });
      } else {
        result[category].push(link);
      }
    }
  }

  console.log(`🔗 Total links checked: ${totalLinks}\n`);

  return result;
}

function generateReport(result: ValidationResult): string {
  const timestamp = new Date().toISOString();
  let report = `# Documentation Link Validation Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `## Summary\n\n`;
  report += `| Category | Count |\n`;
  report += `|----------|-------|\n`;
  report += `| ✅ Valid Links | ${result.valid.length} |\n`;
  report += `| ❌ Broken Links | ${result.broken.length} |\n`;
  report += `| 🌐 External Links | ${result.external.length} |\n`;
  report += `| ⚠️ Warnings | ${result.warnings.length} |\n`;
  report += `| **Total** | **${result.valid.length + result.broken.length + result.external.length + result.warnings.length}** |\n\n`;

  if (result.broken.length > 0) {
    report += `## ❌ Broken Links (${result.broken.length})\n\n`;

    // Group by source file
    const bySource = new Map<string, LinkInfo[]>();
    for (const link of result.broken) {
      const key = link.source.replace(PROJECT_ROOT, '');
      if (!bySource.has(key)) bySource.set(key, []);
      bySource.get(key)!.push(link);
    }

    for (const [source, links] of bySource) {
      report += `### ${source}\n\n`;
      for (const link of links) {
        report += `- **Line ${link.line}:** \`${link.target}\`\n`;
        report += `  - Reason: ${link.text}\n`;
        report += `  - Link text: "${link.text}"\n\n`;
      }
    }
  }

  if (result.warnings.length > 0) {
    report += `## ⚠️ Warnings (${result.warnings.length})\n\n`;
    report += `Links that work but may need attention:\n\n`;

    for (const link of result.warnings) {
      const source = link.source.replace(PROJECT_ROOT, '');
      report += `- \`${source}:${link.line}\` → \`${link.target}\`\n`;
    }
    report += `\n`;
  }

  if (result.external.length > 0) {
    report += `## 🌐 External Links (${result.external.length})\n\n`;
    report += `<details>\n<summary>Click to expand external links catalog</summary>\n\n`;

    // Group by domain
    const byDomain = new Map<string, LinkInfo[]>();
    for (const link of result.external) {
      try {
        const url = new URL(link.target);
        const domain = url.hostname;
        if (!byDomain.has(domain)) byDomain.set(domain, []);
        byDomain.get(domain)!.push(link);
      } catch {
        if (!byDomain.has('invalid')) byDomain.set('invalid', []);
        byDomain.get('invalid')!.push(link);
      }
    }

    for (const [domain, links] of [...byDomain.entries()].sort()) {
      report += `### ${domain} (${links.length})\n\n`;
      for (const link of links.slice(0, 10)) { // Limit to 10 per domain
        const source = link.source.replace(PROJECT_ROOT, '');
        report += `- ${source}:${link.line}\n`;
      }
      if (links.length > 10) {
        report += `- ... and ${links.length - 10} more\n`;
      }
      report += `\n`;
    }

    report += `</details>\n\n`;
  }

  // Critical paths validation
  report += `## 🎯 Critical Navigation Paths\n\n`;

  const criticalPaths = [
    { from: 'README.md', to: 'docs/README.md', description: 'Root to docs index' },
    { from: 'CLAUDE.md', to: 'docs/01-ARCHITECTURE/search-architecture.md', description: 'Claude to search docs' },
    { from: 'docs/README.md', to: 'docs/00-GETTING-STARTED', description: 'Docs index to getting started' },
  ];

  report += `Validating critical documentation paths:\n\n`;
  for (const { from, to, description } of criticalPaths) {
    const fromPath = path.join(PROJECT_ROOT, from);
    if (fs.existsSync(fromPath)) {
      const links = extractLinks(fromPath);
      const hasLink = links.some(l => l.target.includes(to));
      report += `- ${hasLink ? '✅' : '❌'} ${description}: \`${from}\` → \`${to}\`\n`;
    } else {
      report += `- ⚠️ ${description}: \`${from}\` not found\n`;
    }
  }
  report += `\n`;

  // Recommendations
  if (result.broken.length > 0) {
    report += `## 🔧 Recommended Fixes\n\n`;
    report += `1. **Update moved files:** Check if files were moved during restructuring\n`;
    report += `2. **Fix typos:** Verify file name spelling\n`;
    report += `3. **Update anchors:** Ensure section headers match anchor references\n`;
    report += `4. **Relative paths:** Consider using absolute paths from docs root\n`;
    report += `\n`;
  }

  return report;
}

// Main execution
async function main() {
  console.log('🔍 Starting documentation link validation...\n');

  const result = validateAllLinks();
  const report = generateReport(result);

  // Save report
  const reportPath = path.join(PROJECT_ROOT, 'LINK_VALIDATION_REPORT.md');
  fs.writeFileSync(reportPath, report);

  console.log('📊 Validation Summary:');
  console.log(`   ✅ Valid: ${result.valid.length}`);
  console.log(`   ❌ Broken: ${result.broken.length}`);
  console.log(`   🌐 External: ${result.external.length}`);
  console.log(`   ⚠️ Warnings: ${result.warnings.length}`);
  console.log(`\n📝 Full report saved to: ${reportPath}\n`);

  if (result.broken.length > 0) {
    console.log('❌ Validation failed with broken links. See report for details.\n');
    process.exit(1);
  } else {
    console.log('✅ All links validated successfully!\n');
    process.exit(0);
  }
}

main().catch(console.error);
