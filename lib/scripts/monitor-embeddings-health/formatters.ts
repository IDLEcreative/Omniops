import { HealthMetrics, DomainHealth } from './core';

export function printHealthMetrics(metrics: HealthMetrics): void {
  console.log(`  Total pages:          ${metrics.totalPages.toLocaleString()}`);
  console.log(`  Total embeddings:     ${metrics.totalEmbeddings.toLocaleString()}`);
  console.log(`  Coverage:             ${metrics.coverage.toFixed(1)}%`);
  console.log(`  Missing embeddings:   ${metrics.missingEmbeddings.toLocaleString()}`);
  console.log(`  Stale embeddings:     ${metrics.staleEmbeddings.toLocaleString()}`);
  console.log(`  Average age:          ${metrics.averageAge.toFixed(1)} days`);

  if (metrics.oldestEmbedding) {
    console.log(`  Oldest embedding:     ${metrics.oldestEmbedding.toLocaleDateString()}`);
  }
  if (metrics.newestEmbedding) {
    console.log(`  Newest embedding:     ${metrics.newestEmbedding.toLocaleDateString()}`);
  }

  if (metrics.issues.length > 0) {
    metrics.issues.forEach(issue => console.log(`    - ${issue}`));
  } else {
  }
}

export function printDomainHealth(domainHealth: DomainHealth): void {
  console.log('─'.repeat(50));
  printHealthMetrics(domainHealth.metrics);
}

export function printOverallSummary(health: DomainHealth[]): void {
  const totalIssues = health.reduce((sum, h) => sum + h.metrics.issues.length, 0);
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Overall: ${totalIssues} issue(s) detected across all domains`);

  const issuesFound = health.filter(h => h.metrics.issues.length > 0);
  if (issuesFound.length > 0) {
    console.log(`\n⚠️  Issues detected in ${issuesFound.length} domain(s):`);
    for (const domain of issuesFound) {
      domain.metrics.issues.forEach(issue => console.log(`    - ${issue}`));
    }
  } else {
  }

  const totalPages = health.reduce((sum, h) => sum + h.metrics.totalPages, 0);
  const totalEmbeddings = health.reduce((sum, h) => sum + h.metrics.totalEmbeddings, 0);
  const totalMissing = health.reduce((sum, h) => sum + h.metrics.missingEmbeddings, 0);

  console.log(`\n  Total pages: ${totalPages.toLocaleString()}`);
  console.log(`  Total embeddings: ${totalEmbeddings.toLocaleString()}`);
  console.log(`  Missing: ${totalMissing.toLocaleString()}`);
}

export function printWatchStatus(intervalSeconds: number): void {
  console.log(`👁️  Starting continuous monitoring (checking every ${intervalSeconds}s)...\n`);
}

export function printWatchUpdate(health: DomainHealth[]): void {
  console.log(`\n[${new Date().toISOString()}] Running health check...`);

  const issuesFound = health.filter(h => h.metrics.issues.length > 0);
  if (issuesFound.length > 0) {
    console.log(`\n⚠️  Issues detected in ${issuesFound.length} domain(s):`);
    for (const domain of issuesFound) {
      domain.metrics.issues.forEach(issue => console.log(`    - ${issue}`));
    }
  } else {
  }

  const totalPages = health.reduce((sum, h) => sum + h.metrics.totalPages, 0);
  const totalEmbeddings = health.reduce((sum, h) => sum + h.metrics.totalEmbeddings, 0);
  const totalMissing = health.reduce((sum, h) => sum + h.metrics.missingEmbeddings, 0);

  console.log(`\n  Total pages: ${totalPages.toLocaleString()}`);
  console.log(`  Total embeddings: ${totalEmbeddings.toLocaleString()}`);
  console.log(`  Missing: ${totalMissing.toLocaleString()}`);
}

export function showHelp(): void {
  console.log(`
Embeddings Health Monitor - Monitor and maintain embedding quality

USAGE:
  npx tsx scripts/monitoring/monitor-embeddings-health.ts <command> [options]

COMMANDS:
  check                Run health check
  auto                 Run auto-maintenance (fix issues)
  watch                Start continuous monitoring
  help                 Show this help message

OPTIONS:
  --domain=<domain>    Check specific domain (e.g., --domain=example.com)
  --interval=<sec>     Monitoring interval in seconds (default: 300)

EXAMPLES:
  npx tsx scripts/monitoring/monitor-embeddings-health.ts check
  npx tsx scripts/monitoring/monitor-embeddings-health.ts check --domain=example.com
  npx tsx scripts/monitoring/monitor-embeddings-health.ts auto
  npx tsx scripts/monitoring/monitor-embeddings-health.ts watch
  npx tsx scripts/monitoring/monitor-embeddings-health.ts watch --interval=60

HEALTH METRICS:
  Coverage           - Percentage of pages with embeddings (target: 90%+)
  Staleness          - Embeddings older than 90 days
  Missing            - Pages without embeddings
  Average Age        - Mean age of embeddings in days
  Issues             - Detected problems requiring attention
`);
}
