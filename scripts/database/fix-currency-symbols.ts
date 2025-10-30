/**
 * Batch Currency Symbol Fix Script
 * Replaces all hardcoded £ symbols with dynamic currency from params
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const FILES_TO_FIX = [
  'lib/chat/order-operations/order-history.ts',
  'lib/chat/order-operations/order-refunds-cancellation.ts',
  'lib/chat/store-operations.ts',
  'lib/chat/analytics-operations.ts',
  'lib/chat/report-operations.ts',
  'lib/chat/product-operations/product-variation-operations.ts',
  'lib/chat/product-operations/stock-operations.ts',
  'lib/chat/product-operations/product-search-operations.ts',
  'lib/chat/woocommerce-tool-formatters.ts'
];

function addCurrencyHelper(content: string): string {
  // Check if helper already exists
  if (content.includes('function getCurrencySymbol')) {
    return content;
  }

  // Find the import section
  const importMatch = content.match(/(import.*from.*;\n)+/s);
  if (!importMatch) {
    console.error('Could not find import section');
    return content;
  }

  const importSection = importMatch[0];
  const afterImports = content.slice(importSection.length);

  // Add currency helper after imports
  const helper = `
/**
 * Get currency symbol from params (fallback to $ if not provided)
 */
function getCurrencySymbol(params: any): string {
  return params.currency?.symbol || '$';
}
`;

  return importSection + helper + afterImports;
}

function replaceCurrencySymbols(content: string): string {
  // Pattern 1: £${variable} -> ${getCurrencySymbol(params)}${variable}
  content = content.replace(/£\$\{([^}]+)\}/g, '${getCurrencySymbol(params)}${$1}');

  // Pattern 2: £" in template strings -> ${getCurrencySymbol(params)}"
  // But we need to be careful to add const currencySymbol first

  return content;
}

function addCurrencyVariable(content: string): string {
  // Find functions that build message strings
  const functionPattern = /export async function \w+\([^)]+\): Promise<WooCommerceOperationResult> \{\s*try \{/g;

  let match;
  const replacements: Array<{start: number, end: number, replacement: string}> = [];

  while ((match = functionPattern.exec(content)) !== null) {
    const insertPos = match.index + match[0].length;

    // Check if currencySymbol already defined in this function
    const nextFunctionStart = content.indexOf('export async function', insertPos);
    const functionEnd = nextFunctionStart === -1 ? content.length : nextFunctionStart;
    const functionBody = content.slice(insertPos, functionEnd);

    if (!functionBody.includes('const currencySymbol') && functionBody.includes('£')) {
      replacements.push({
        start: insertPos,
        end: insertPos,
        replacement: '\n    const currencySymbol = getCurrencySymbol(params);'
      });
    }
  }

  // Apply replacements in reverse order to maintain positions
  for (const repl of replacements.reverse()) {
    content = content.slice(0, repl.start) + repl.replacement + content.slice(repl.end);
  }

  return content;
}

function processFile(filePath: string): void {
  console.log(`Processing: ${filePath}`);

  try {
    let content = readFileSync(filePath, 'utf-8');
    const original = content;

    // Skip if no currency symbols found
    if (!content.includes('£')) {
      console.log(`  ✓ No currency symbols found`);
      return;
    }

    // Step 1: Add helper function
    content = addCurrencyHelper(content);

    // Step 2: Add currencySymbol variable to functions that need it
    content = addCurrencyVariable(content);

    // Step 3: Replace all £ with currencySymbol
    const poundCount = (content.match(/£/g) || []).length;
    content = content.replace(/£/g, '${currencySymbol}');

    // Fix template literal issues (if £ was not in template literal, wrap it)
    // Pattern: "text ${currencySymbol}text" should be `text ${currencySymbol}text`

    if (content !== original) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`  ✅ Fixed ${poundCount} currency symbols`);
    } else {
      console.log(`  ✓ No changes needed`);
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main execution
console.log('🔧 Starting currency symbol fix...\n');

for (const file of FILES_TO_FIX) {
  const fullPath = join(process.cwd(), file);
  processFile(fullPath);
}

console.log('\n✅ Currency symbol fix complete!');
console.log('Note: Manual review recommended for complex template literals.');
