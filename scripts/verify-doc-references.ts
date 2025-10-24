#!/usr/bin/env node
/**
 * Documentation File Reference Validator
 *
 * Scans all markdown files for code/file references and verifies they exist.
 * Reports missing files, broken links, and provides recommendations.
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileReference {
  file: string;
  line: number;
  reference: string;
  context: string;
}

interface ValidationResult {
  totalReferences: number;
  validReferences: number;
  missingFiles: FileReference[];
  invalidPaths: FileReference[];
  warnings: FileReference[];
}

const PROJECT_ROOT = process.cwd();

// Common file path patterns to check
const FILE_PATTERNS = [
  // Direct file paths
  /(?:^|\s|`)((?:app|lib|components|types|__tests__|scripts|docs|public|supabase)\/[a-zA-Z0-9_\-\/\.]+\.(?:ts|tsx|js|jsx|md|json|sql))/g,

  // Markdown links to files
  /\[([^\]]+)\]\(((?:\.\.?\/)*(?:[a-zA-Z0-9_\-\/\.]+))\)/g,

  // Code block imports
  /(?:import|from|require)\s+['"]([\.\/][^'"]+)['"]/g,

  // See/ref patterns
  /See\s+(?:`|)([a-zA-Z0-9_\-\/\.]+\.(?:ts|tsx|js|jsx|md|json))(?:`|)/gi,
];

const IGNORE_PATTERNS = [
  /^https?:\/\//i,  // URLs
  /^mailto:/i,      // Email links
  /^\[.*\]$/,       // Reference-style links
  /\$\{.*\}/,       // Template variables
  /\[feature\]/,    // Placeholder text
  /\[id\]/,         // Placeholder text
  /\[jobId\]/,      // Placeholder text
  /example\./i,     // Example paths
];

function shouldIgnoreReference(ref: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(ref));
}

function extractFileReferences(content: string, filePath: string): FileReference[] {
  const references: FileReference[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    FILE_PATTERNS.forEach(pattern => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        // Get the captured file path (might be in different groups)
        const reference = match[1] || match[2];
        if (reference && !shouldIgnoreReference(reference)) {
          references.push({
            file: filePath,
            line: index + 1,
            reference: reference.trim(),
            context: line.trim().substring(0, 100),
          });
        }
      }
    });
  });

  return references;
}

function resolveFilePath(reference: string, sourceFile: string): string {
  // Handle absolute paths from project root
  if (reference.startsWith('app/') ||
      reference.startsWith('lib/') ||
      reference.startsWith('components/') ||
      reference.startsWith('types/') ||
      reference.startsWith('__tests__/') ||
      reference.startsWith('scripts/') ||
      reference.startsWith('docs/') ||
      reference.startsWith('public/') ||
      reference.startsWith('supabase/')) {
    return path.join(PROJECT_ROOT, reference);
  }

  // Handle relative paths
  if (reference.startsWith('./') || reference.startsWith('../')) {
    const sourceDir = path.dirname(sourceFile);
    return path.resolve(sourceDir, reference);
  }

  // Try as absolute from project root
  return path.join(PROJECT_ROOT, reference);
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function findMarkdownFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip these directories
      if (!file.match(/^(node_modules|\.next|dist|\.git)$/)) {
        findMarkdownFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(path.relative(PROJECT_ROOT, filePath));
    }
  });

  return fileList;
}

function validateDocumentation(): ValidationResult {
  const result: ValidationResult = {
    totalReferences: 0,
    validReferences: 0,
    missingFiles: [],
    invalidPaths: [],
    warnings: [],
  };

  console.log('🔍 Scanning documentation files...\n');

  // Find all markdown files
  const docFiles = findMarkdownFiles(PROJECT_ROOT);

  console.log(`📄 Found ${docFiles.length} markdown files\n`);

  // Process each doc file
  for (const docFile of docFiles) {
    const fullPath = path.join(PROJECT_ROOT, docFile);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const references = extractFileReferences(content, docFile);

    for (const ref of references) {
      result.totalReferences++;

      const resolvedPath = resolveFilePath(ref.reference, fullPath);

      if (fileExists(resolvedPath)) {
        result.validReferences++;
      } else {
        // Check if it's a directory
        if (fs.existsSync(resolvedPath.replace(/\/[^\/]+$/, ''))) {
          result.invalidPaths.push(ref);
        } else {
          result.missingFiles.push(ref);
        }
      }
    }
  }

  return result;
}

function printReport(result: ValidationResult): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 DOCUMENTATION REFERENCE VALIDATION REPORT');
  console.log('='.repeat(80) + '\n');

  console.log('📈 Summary:');
  console.log(`  Total references found: ${result.totalReferences}`);
  console.log(`  Valid references: ${result.validReferences} (${Math.round(result.validReferences / result.totalReferences * 100)}%)`);
  console.log(`  Missing files: ${result.missingFiles.length}`);
  console.log(`  Invalid paths: ${result.invalidPaths.length}`);
  console.log(`  Warnings: ${result.warnings.length}\n`);

  if (result.missingFiles.length > 0) {
    console.log('❌ Missing Files:');
    console.log('─'.repeat(80));

    // Group by source file
    const grouped = result.missingFiles.reduce((acc, ref) => {
      if (!acc[ref.file]) acc[ref.file] = [];
      acc[ref.file].push(ref);
      return acc;
    }, {} as Record<string, FileReference[]>);

    Object.entries(grouped).forEach(([file, refs]) => {
      console.log(`\n📄 ${file}`);
      refs.forEach(ref => {
        console.log(`   Line ${ref.line}: ${ref.reference}`);
        console.log(`   Context: ${ref.context}`);
      });
    });
    console.log('\n');
  }

  if (result.invalidPaths.length > 0) {
    console.log('⚠️  Invalid Paths (file not found in expected location):');
    console.log('─'.repeat(80));

    const grouped = result.invalidPaths.reduce((acc, ref) => {
      if (!acc[ref.file]) acc[ref.file] = [];
      acc[ref.file].push(ref);
      return acc;
    }, {} as Record<string, FileReference[]>);

    Object.entries(grouped).forEach(([file, refs]) => {
      console.log(`\n📄 ${file}`);
      refs.forEach(ref => {
        console.log(`   Line ${ref.line}: ${ref.reference}`);
      });
    });
    console.log('\n');
  }

  console.log('💡 Recommendations:');
  console.log('─'.repeat(80));

  if (result.missingFiles.length > 0) {
    console.log('1. Review missing file references and either:');
    console.log('   - Update documentation to point to correct files');
    console.log('   - Create missing files if they should exist');
    console.log('   - Remove outdated references');
  }

  if (result.invalidPaths.length > 0) {
    console.log('2. Check invalid paths - they may be placeholders or examples');
  }

  console.log('3. Run this validator regularly during documentation updates');
  console.log('4. Consider adding to CI/CD pipeline\n');

  console.log('='.repeat(80) + '\n');
}

async function main() {
  try {
    const result = validateDocumentation();
    printReport(result);

    // Exit with error if there are missing files
    if (result.missingFiles.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running validation:', error);
    process.exit(1);
  }
}

main();
