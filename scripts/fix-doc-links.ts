#!/usr/bin/env ts-node

/**
 * Automated Documentation Link Fixer
 *
 * Attempts to automatically fix common broken link patterns:
 * 1. Moved files during restructuring
 * 2. Incorrect relative paths
 * 3. Missing anchor references
 *
 * Usage: npx tsx scripts/fix-doc-links.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const PROJECT_ROOT = '/Users/jamesguy/Omniops';
const DRY_RUN = process.argv.includes('--dry-run');

interface LinkMapping {
  old: string;
  new: string;
  reason: string;
}

// Known file moves from the restructuring
const FILE_MAPPINGS: LinkMapping[] = [
  // SUPABASE_SCHEMA.md exists in both locations - prefer new location
  { old: '/SUPABASE_SCHEMA.md', new: '/docs/SUPABASE_SCHEMA.md', reason: 'Use docs/ version' },
  { old: '../SUPABASE_SCHEMA.md', new: '../SUPABASE_SCHEMA.md', reason: 'Already in docs/' },
  { old: '../../SUPABASE_SCHEMA.md', new: '../SUPABASE_SCHEMA.md', reason: 'Relative from subdirs' },
  { old: '../../../SUPABASE_SCHEMA.md', new: '../../SUPABASE_SCHEMA.md', reason: 'Relative from deep subdirs' },

  // Alternative: use the new database-schema.md in 01-ARCHITECTURE
  // { old: 'SUPABASE_SCHEMA.md', new: '01-ARCHITECTURE/database-schema.md', reason: 'New schema location' },

  { old: '/DOCKER_README.md', new: '/docs/setup/DOCKER_README.md', reason: 'Docker docs in setup' },
  { old: '../../DOCKER_README.md', new: '../setup/DOCKER_README.md', reason: 'Docker docs in setup relative' },
  { old: '/docs/DOCKER_README.md', new: '/docs/setup/DOCKER_README.md', reason: 'Docker moved to setup' },

  // These files exist in both old and new locations - use existing docs/ version for now
  { old: '../SEARCH_ARCHITECTURE.md', new: '../SEARCH_ARCHITECTURE.md', reason: 'Use existing location' },
  { old: '/docs/SEARCH_ARCHITECTURE.md', new: '/docs/SEARCH_ARCHITECTURE.md', reason: 'Already correct' },

  { old: '../PERFORMANCE_OPTIMIZATION.md', new: '../PERFORMANCE_OPTIMIZATION.md', reason: 'Use existing location' },
  { old: '/docs/PERFORMANCE_OPTIMIZATION.md', new: '/docs/PERFORMANCE_OPTIMIZATION.md', reason: 'Already correct' },

  { old: '../HALLUCINATION_PREVENTION.md', new: '../HALLUCINATION_PREVENTION.md', reason: 'Use existing location' },
  { old: '/docs/HALLUCINATION_PREVENTION.md', new: '/docs/HALLUCINATION_PREVENTION.md', reason: 'Already correct' },

  { old: '../TESTING.md', new: '../TESTING.md', reason: 'Use existing location' },
  { old: '/docs/TESTING.md', new: '/docs/TESTING.md', reason: 'Already correct' },

  { old: '../docs/ANALYTICS.md', new: '../02-FEATURES/analytics/README.md', reason: 'Moved to features' },
  { old: '/Users/jamesguy/Omniops/docs/ANALYTICS.md', new: '../02-FEATURES/analytics/README.md', reason: 'Moved to features' },

  { old: '../docs/testing/', new: '../04-DEVELOPMENT/testing/', reason: 'Testing moved' },
  { old: '../docs/environment-setup.md', new: '../00-GETTING-STARTED/quick-start.md', reason: 'Renamed to quick-start' },

  { old: '../docs/AUTHENTICATION.md', new: '../07-REFERENCE/authentication.md', reason: 'Moved to reference' },
  { old: '../../../docs/AUTHENTICATION.md', new: '../07-REFERENCE/authentication.md', reason: 'Moved to reference' },

  // Cross-references between old structure
  { old: '../chat/README.md', new: '../chat-system/README.md', reason: 'Renamed directory' },
  { old: '../testing/README.md', new: '../../04-DEVELOPMENT/testing/README.md', reason: 'Moved to development' },
  { old: '../testing/testing-guide.md', new: '../../04-DEVELOPMENT/testing/testing-guide.md', reason: 'Moved to development' },
  { old: '../../app/api/README.md', new: '../../03-API/README.md', reason: 'API docs moved' },
];

// Anchor fixes - common header format issues
// GitHub converts "& " to "-and-" and removes special chars
const ANCHOR_FIXES: Record<string, string> = {
  // Table of contents with ampersands (& becomes -and-)
  '#content--scraping': '#content--scraping',
  '#ai--embeddings': '#ai--embeddings',
  '#chat--communication': '#chat--communication',
  '#telemetry--analytics': '#telemetry--analytics',
  '#privacy--compliance': '#privacy--compliance',

  // Common TOC patterns
  '#performance-goals--current-metrics': '#performance-goals-and-current-metrics',
  '#search--embeddings-performance': '#search-and-embeddings-performance',
  '#monitoring--metrics': '#monitoring-and-metrics',
  '#performance--scaling': '#performance-and-scaling',
  '#monitoring--debugging': '#monitoring-and-debugging',

  // Numbered sections
  '#1-pre-deployment-checklist': '#pre-deployment-checklist',
  '#2-environment-setup': '#environment-setup',
  '#3-database-migration': '#database-migration',
  '#4-deployment-process': '#deployment-process',
  '#5-post-deployment-verification': '#post-deployment-verification',
  '#6-rollback-procedures': '#rollback-procedures',
  '#7-monitoring-setup': '#monitoring-setup',
  '#8-security-checklist': '#security-checklist',
  '#9-performance-checklist': '#performance-checklist',
  '#10-compliance-checklist': '#compliance-checklist',

  // Runbook sections
  '#1-standard-release-deployment': '#standard-release-deployment',
  '#2-hotfix-deployment': '#hotfix-deployment',
  '#4-emergency-rollback': '#emergency-rollback',
  '#5-first-time-production-deploy': '#first-time-production-deploy',
  '#6-scaling-up': '#scaling-up',
  '#7-disaster-recovery': '#disaster-recovery',

  // Step-by-step guides
  '#step-by-step-guide': '#guide',
  '#cicd-integration': '#ci-cd-integration',
  '#testing--debugging': '#testing-and-debugging',
  '#search-integration-rag': '#search-integration',
};

function fixLinks(filePath: string): { fixes: number; content: string } {
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixes = 0;

  // Fix file path links
  for (const { old, new: newPath, reason } of FILE_MAPPINGS) {
    const oldPattern = `](${old})`;
    const newPattern = `](${newPath})`;

    if (content.includes(oldPattern)) {
      content = content.replace(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPattern);
      fixes++;
      console.log(`  ✓ Fixed: ${old} → ${newPath} (${reason})`);
    }
  }

  // Fix anchor links
  for (const [oldAnchor, newAnchor] of Object.entries(ANCHOR_FIXES)) {
    const oldPattern = `](${oldAnchor})`;
    const newPattern = `](${newAnchor})`;

    if (content.includes(oldPattern)) {
      content = content.replace(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPattern);
      fixes++;
      console.log(`  ✓ Fixed anchor: ${oldAnchor} → ${newAnchor}`);
    }
  }

  return { fixes, content };
}

function fixAllDocs(): void {
  const files = glob.sync('**/*.md', {
    cwd: PROJECT_ROOT,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/ARCHIVE/**', // Don't fix archived docs
    ],
  });

  console.log(`\n🔧 ${DRY_RUN ? '[DRY RUN]' : 'Fixing'} documentation links...\n`);

  let totalFiles = 0;
  let totalFixes = 0;

  for (const file of files) {
    const { fixes, content } = fixLinks(file);

    if (fixes > 0) {
      totalFiles++;
      totalFixes += fixes;

      const relPath = file.replace(PROJECT_ROOT, '');
      console.log(`\n📄 ${relPath}`);
      console.log(`   Fixed ${fixes} link(s)`);

      if (!DRY_RUN) {
        fs.writeFileSync(file, content);
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Files modified: ${totalFiles}`);
  console.log(`   Total fixes: ${totalFixes}`);

  if (DRY_RUN) {
    console.log(`\n💡 Run without --dry-run to apply fixes\n`);
  } else {
    console.log(`\n✅ Links fixed! Run validation again to check remaining issues.\n`);
  }
}

// Main execution
fixAllDocs();
