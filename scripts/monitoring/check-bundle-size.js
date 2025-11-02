/**
 * Bundle Size Monitoring Script
 *
 * Checks widget bundle sizes against defined limits.
 * Used in CI/CD to prevent bundle size regressions.
 *
 * Usage:
 *   npm run check:bundle
 *   node scripts/monitoring/check-bundle-size.js
 *
 * Exit codes:
 *   0 - All bundles within limits
 *   1 - One or more bundles exceed limits
 */

const fs = require('fs');
const path = require('path');

// Bundle size limits (in bytes)
const LIMITS = {
  'embed.js': 15 * 1024,           // 15 KB - minimal loader
  'w.js': 5 * 1024,                // 5 KB - ultra-minimal loader
  'widget-bundle.js': 100 * 1024,  // 100 KB - full widget (target: 60 KB)
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function checkFileSize(filePath, limit) {
  const fullPath = path.join(__dirname, '../../public', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.yellow}⚠️  File not found: ${filePath}${colors.reset}`);
    return { passed: false, reason: 'not_found' };
  }

  const stats = fs.statSync(fullPath);
  const size = stats.size;
  const sizeFormatted = formatBytes(size);
  const limitFormatted = formatBytes(limit);
  const percentUsed = ((size / limit) * 100).toFixed(1);

  if (size > limit) {
    const overBy = formatBytes(size - limit);
    console.log(
      `${colors.red}❌ ${filePath}: ${sizeFormatted} / ${limitFormatted} (${percentUsed}%) - EXCEEDED by ${overBy}${colors.reset}`
    );
    return { passed: false, size, limit, percentUsed: parseFloat(percentUsed) };
  } else {
    const status = percentUsed > 90 ? colors.yellow + '⚠️ ' : colors.green + '✅';
    console.log(
      `${status} ${filePath}: ${sizeFormatted} / ${limitFormatted} (${percentUsed}%)${colors.reset}`
    );
    return { passed: true, size, limit, percentUsed: parseFloat(percentUsed) };
  }
}

function main() {
  console.log(`\n${colors.cyan}📦 Checking widget bundle sizes...${colors.reset}\n`);

  let allPassed = true;
  const results = {};

  for (const [file, limit] of Object.entries(LIMITS)) {
    const result = checkFileSize(file, limit);
    results[file] = result;

    if (!result.passed && result.reason !== 'not_found') {
      allPassed = false;
    }
  }

  // Summary
  console.log(`\n${colors.cyan}─────────────────────────────────────${colors.reset}`);

  if (allPassed) {
    console.log(`${colors.green}✅ All bundles within size limits${colors.reset}\n`);

    // Show warnings for bundles approaching limits
    const warnings = Object.entries(results).filter(
      ([_, result]) => result.passed && result.percentUsed && result.percentUsed > 80
    );

    if (warnings.length > 0) {
      console.log(`${colors.yellow}⚠️  Warning: These bundles are approaching their limits:${colors.reset}`);
      warnings.forEach(([file, result]) => {
        console.log(`   ${file}: ${result.percentUsed}% used`);
      });
      console.log();
    }

    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Bundle size check FAILED${colors.reset}`);
    console.log(`${colors.red}   One or more bundles exceed size limits${colors.reset}\n`);

    // Recommendations
    console.log(`${colors.cyan}💡 Recommendations:${colors.reset}`);
    console.log(`   - Review recent changes for unnecessary dependencies`);
    console.log(`   - Use dynamic imports for large features`);
    console.log(`   - Consider code splitting for the widget`);
    console.log(`   - Run: npm run build:widget -- --analyze\n`);

    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkFileSize, LIMITS };
