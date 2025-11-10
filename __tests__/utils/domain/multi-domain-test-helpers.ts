/**
 * Multi-Domain Chat Test Utilities
 *
 * Shared helper functions for testing brand-agnostic and multi-tenant functionality.
 * Used by all domain-specific test modules.
 *
 * Type: Testing Utilities
 * Status: Active
 * Last Updated: 2025-11-10
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export interface DomainTestResult {
  domain: string;
  businessType: string;
  testsPassed: number;
  testsFailed: number;
  violations: string[];
  status: 'PASS' | 'FAIL';
}

/**
 * Check if domain is hardcoded in file (not from environment variable)
 */
export async function checkForHardcodedDomain(domain: string, filePath: string): Promise<boolean> {
  const content = await fs.readFile(filePath, 'utf-8');

  // Check if domain is hardcoded (not in env var)
  const hardcodedPattern = new RegExp(`['"]${domain}['"]`, 'g');
  const matches = content.match(hardcodedPattern) || [];

  // Filter out comments and acceptable usage
  const violations = matches.filter(match => {
    const index = content.indexOf(match);
    const contextBefore = content.substring(Math.max(0, index - 100), index);

    // Acceptable if in environment variable or comment
    return !contextBefore.includes('process.env') &&
           !contextBefore.includes('//') &&
           !contextBefore.includes('/*');
  });

  return violations.length > 0;
}

/**
 * Check system prompts for brand-specific terminology
 */
export async function checkSystemPromptsForBrands(terms: string[]): Promise<boolean> {
  const filesToCheck = [
    join(process.cwd(), 'lib/chat/system-prompts.ts'),
    join(process.cwd(), 'lib/agents/customer-service-agent.ts')
  ];

  for (const filePath of filesToCheck) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      for (const term of terms) {
        // Check for term not in placeholders like [PRODUCT_NAME]
        const pattern = new RegExp(`(?<!\\[)\\b${term}\\b(?!\\])`, 'gi');
        if (pattern.test(content)) {
          // Verify it's not in a comment explaining removal
          const contextPattern = new RegExp(`(?<!removed|eliminated|deleted).*${term}`, 'gi');
          if (contextPattern.test(content)) {
            return true;
          }
        }
      }
    } catch {
      // File may not exist in test environment, skip
    }
  }

  return false;
}

/**
 * Check for product-specific boosting in search logic
 */
export async function checkForProductBoosting(productIdentifier: string): Promise<boolean> {
  const searchFiles = [
    join(process.cwd(), 'lib/enhanced-embeddings.ts'),
    join(process.cwd(), 'lib/enhanced-embeddings-search.ts'),
    join(process.cwd(), 'lib/search-intelligence.ts')
  ];

  for (const filePath of searchFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for product identifier references
      if (content.includes(productIdentifier)) {
        return true;
      }

      // Check for artificial score boosting patterns
      if (content.includes('score = 0.99') || content.includes('score = 1.0')) {
        return true;
      }
    } catch {
      // File may not exist, skip
    }
  }

  return false;
}

/**
 * Check if API requires domain parameter
 */
export async function checkApiRequiresDomain(apiPath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(apiPath, 'utf-8');
    return content.includes('if (!domain)') && content.includes('status: 400');
  } catch {
    return false;
  }
}

/**
 * Check for brand references in production code
 */
export async function checkCodeForBrandReferences(brandName: string): Promise<boolean> {
  try {
    // Use grep to search for brand references in production code
    const result = execSync(
      `grep -r "${brandName}" lib/ components/ app/api/ --include="*.ts" --include="*.tsx" 2>&1 || true`,
      { encoding: 'utf-8' }
    );

    // Filter out acceptable references (in comments explaining removal)
    const lines = result.split('\n').filter(line => {
      return line.length > 0 &&
             !line.includes('REMOVED') &&
             !line.includes('deprecated') &&
             !line.includes('Example:');
    });

    return lines.length > 0;
  } catch {
    return false;
  }
}

/**
 * Check cache preloading configuration for hardcoded domains
 */
export async function checkCachePreloading(domain: string, filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Check if domain is hardcoded in preload array
    const hardcodedPattern = new RegExp(`['"]${domain}['"]`, 'g');
    const matches = content.match(hardcodedPattern) || [];

    // Check if it's in a static array (not from env var)
    return matches.some(match => {
      const index = content.indexOf(match);
      const contextBefore = content.substring(Math.max(0, index - 150), index);

      return !contextBefore.includes('process.env') &&
             !contextBefore.includes('split(') &&
             contextBefore.includes('[');
    });
  } catch {
    return false;
  }
}

/**
 * Check if prompts use generic placeholders instead of hardcoded examples
 */
export async function checkPromptsUseGenericPlaceholders(): Promise<boolean> {
  const promptFiles = [
    join(process.cwd(), 'lib/chat/system-prompts.ts'),
    join(process.cwd(), 'lib/agents/customer-service-agent.ts')
  ];

  for (const filePath of promptFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for generic placeholders like [PRODUCT_NAME], [COMPANY_NAME], etc.
      const hasPlaceholders = /\[PRODUCT_NAME\]|\[COMPANY_NAME\]|\[SKU\]|\[PREVIOUS_TOPIC\]/gi.test(content);

      if (!hasPlaceholders) {
        // If no placeholders, check if there are hardcoded examples instead
        const hasHardcodedExamples = /Cifa|Thompson|Agri Flip|A4VTG90|K2053463/gi.test(content);
        if (hasHardcodedExamples) {
          return false;
        }
      }
    } catch {
      // File may not exist, skip
    }
  }

  return true;
}

/**
 * Check for hardcoded SKUs in prompts
 */
export async function checkForHardcodedSKUs(skus: string[]): Promise<boolean> {
  const promptFiles = [
    join(process.cwd(), 'lib/chat/system-prompts.ts'),
    join(process.cwd(), 'lib/agents/customer-service-agent.ts')
  ];

  for (const filePath of promptFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      for (const sku of skus) {
        // Check if SKU exists but is not in a placeholder
        if (content.includes(sku) && !content.includes(`[${sku}]`)) {
          return true;
        }
      }
    } catch {
      // File may not exist, skip
    }
  }

  return false;
}

/**
 * Check for artificial score boosting in search logic
 */
export async function checkForArtificialScoring(): Promise<boolean> {
  const searchFiles = [
    join(process.cwd(), 'lib/enhanced-embeddings.ts'),
    join(process.cwd(), 'lib/enhanced-embeddings-search.ts'),
    join(process.cwd(), 'lib/search-intelligence.ts')
  ];

  for (const filePath of searchFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for suspicious scoring patterns
      const artificialPatterns = [
        /score\s*=\s*0\.99/,  // Artificial maximum score
        /score\s*=\s*1\.0/,   // Perfect score
        /if\s*\(.*\.includes\(['"]agri-flip['"]\)/,  // Product-specific checks
        /if\s*\(.*\.includes\(['"]cifa['"]\)/
      ];

      for (const pattern of artificialPatterns) {
        if (pattern.test(content)) {
          return true;
        }
      }
    } catch {
      // File may not exist, skip
    }
  }

  return false;
}

/**
 * Get emoji icon for business type
 */
export function getBusinessTypeIcon(businessType: string): string {
  const icons: Record<string, string> = {
    'Restaurant': '🍽️',
    'Real Estate': '🏠',
    'Healthcare': '🏥',
    'E-commerce': '🛒',
    'Education': '🎓',
    'Hospitality': '🏨'
  };
  return icons[businessType] || '📦';
}

/**
 * Create test result object with defaults
 */
export function createTestResult(domain: string, businessType: string): DomainTestResult {
  return {
    domain,
    businessType,
    testsPassed: 0,
    testsFailed: 0,
    violations: [],
    status: 'PASS'
  };
}

/** Update result status based on failures */
export function finializeTestResult(result: DomainTestResult): void {
  result.status = result.testsFailed === 0 ? 'PASS' : 'FAIL';
}