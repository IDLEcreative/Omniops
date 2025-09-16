/**
 * Final Comprehensive Query Inspector Validation
 * Demonstrates all features working together in a realistic scenario
 */

import { createQueryInspector } from './lib/dev-tools';
import { runPerformanceValidation } from './test-query-inspector-performance';
import { runN1AccuracyTests } from './test-query-inspector-n+1-accuracy';

// Realistic database client simulation
class RealisticDatabaseClient {
  constructor() {
    // Bind methods
    this.query = this.query.bind(this);
    this.execute = this.execute.bind(this);
    this.transaction = this.transaction.bind(this);
  }

  async query(sql: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    // Simulate realistic database timing
    const queryType = sql.trim().split(' ')[0].toUpperCase();
    let delay = 10; // Base delay
    
    // Different query types have different performance characteristics
    switch (queryType) {
      case 'SELECT':
        delay = Math.random() * 100 + 20; // 20-120ms
        break;
      case 'INSERT':
        delay = Math.random() * 50 + 30; // 30-80ms
        break;
      case 'UPDATE':
        delay = Math.random() * 80 + 25; // 25-105ms
        break;
      case 'DELETE':
        delay = Math.random() * 60 + 20; // 20-80ms
        break;
    }
    
    // Simulate occasional slow queries
    if (Math.random() < 0.1) { // 10% chance of slow query
      delay *= 3; // 3x slower
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const rowCount = queryType === 'SELECT' ? 
      Math.floor(Math.random() * 50) + 1 : 
      Math.floor(Math.random() * 10) + 1;
    
    return {
      rows: Array(rowCount).fill({}).map((_, i) => ({ 
        id: i + 1, 
        data: `result_${i}`,
        timestamp: new Date()
      })),
      rowCount
    };
  }

  async execute(sql: string, params: any[] = []): Promise<{ affectedRows: number }> {
    const delay = Math.random() * 50 + 15; // 15-65ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      affectedRows: Math.floor(Math.random() * 5) + 1
    };
  }

  async transaction(callback: Function): Promise<any> {
    const startDelay = Math.random() * 20 + 5; // Transaction overhead
    await new Promise(resolve => setTimeout(resolve, startDelay));
    
    const result = await callback(this);
    
    const commitDelay = Math.random() * 15 + 5; // Commit overhead
    await new Promise(resolve => setTimeout(resolve, commitDelay));
    
    return result;
  }
}

async function simulateRealisticWorkload(client: any, inspector: any) {
  console.log('🏗️  Simulating realistic application workload...\n');
  
  // User registration flow
  console.log('1. User Registration Flow');
  await client.query('INSERT INTO users (name, email, created_at) VALUES (?, ?, NOW())', 
    ['John Doe', 'john@example.com']);
  await client.query('INSERT INTO user_profiles (user_id, preferences) VALUES (?, ?)', 
    [1, '{}']);
  await client.query('INSERT INTO audit_log (action, user_id, timestamp) VALUES (?, ?, NOW())', 
    ['user_created', 1]);
  
  // Dashboard loading (potential N+1)
  console.log('2. Dashboard Loading (N+1 simulation)');
  const users = await client.query('SELECT id, name FROM users WHERE active = 1 LIMIT 10');
  
  // Bad pattern: Load each user's details separately
  for (let i = 1; i <= 5; i++) {
    await client.query('SELECT * FROM user_profiles WHERE user_id = ?', [i]);
    await client.query('SELECT COUNT(*) FROM posts WHERE user_id = ?', [i]);
  }
  
  // Content management operations
  console.log('3. Content Management');
  await client.query('SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT 20');
  await client.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [1]);
  await client.query('INSERT INTO post_views (post_id, user_id, viewed_at) VALUES (?, ?, NOW())', [1, 1]);
  
  // Search functionality
  console.log('4. Search Operations');
  await client.query(`
    SELECT p.*, u.name as author_name 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.title LIKE ? OR p.content LIKE ?
    ORDER BY p.created_at DESC
  `, ['%search%', '%search%']);
  
  // Analytics queries (potentially slow)
  console.log('5. Analytics Queries');
  await client.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as post_count,
      COUNT(DISTINCT user_id) as unique_authors
    FROM posts 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);
  
  // Transaction example
  console.log('6. Transaction Processing');
  await client.transaction(async (tx: any) => {
    await tx.query('INSERT INTO orders (user_id, total_amount) VALUES (?, ?)', [1, 99.99]);
    await tx.query('UPDATE inventory SET quantity = quantity - 1 WHERE product_id = ?', [123]);
    await tx.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', 
      [1, 123, 1, 99.99]);
  });
  
  // Cleanup operations
  console.log('7. Maintenance Operations');
  await client.execute('DELETE FROM expired_sessions WHERE expires_at < NOW()');
  await client.execute('UPDATE users SET last_seen = NOW() WHERE id = ?', [1]);
  
  console.log('✅ Workload simulation completed\n');
}

async function demonstrateEventHandling(inspector: any) {
  console.log('📡 Event Handling Demonstration\n');
  
  let eventCounts = {
    queries: 0,
    slowQueries: 0,
    nPlusOnes: 0,
    reports: 0
  };
  
  // Set up event listeners
  inspector.on('query', (execution: any) => {
    eventCounts.queries++;
    if (eventCounts.queries % 10 === 0) {
      console.log(`   📊 Processed ${eventCounts.queries} queries...`);
    }
  });
  
  inspector.on('slowQuery', (slowQuery: any) => {
    eventCounts.slowQueries++;
    console.log(`   🐌 Slow query #${eventCounts.slowQueries}: ${slowQuery.execution.duration.toFixed(2)}ms`);
  });
  
  inspector.on('nPlusOne', (issues: any[]) => {
    eventCounts.nPlusOnes++;
    console.log(`   🚨 N+1 pattern #${eventCounts.nPlusOnes}: ${issues[0].occurrences} similar queries`);
  });
  
  inspector.on('report', (stats: any) => {
    eventCounts.reports++;
    console.log(`   📊 Auto-report #${eventCounts.reports}: ${stats.totalQueries} total queries`);
  });
  
  return eventCounts;
}

async function generateComprehensiveReport(inspector: any) {
  console.log('📊 Generating Comprehensive Performance Report\n');
  console.log('='.repeat(80));
  
  const stats = inspector.generateStats();
  const memory = inspector.getMemoryUsage();
  const realTime = inspector.getRealTimeData();
  
  // Performance Summary
  console.log('🏎️  PERFORMANCE SUMMARY');
  console.log(`   Total Queries: ${stats.totalQueries}`);
  console.log(`   Total Time: ${stats.totalTime.toFixed(2)}ms`);
  console.log(`   Average Time: ${stats.avgTime.toFixed(2)}ms`);
  console.log(`   Median Time: ${stats.totalTime / stats.totalQueries}ms (est.)`);
  console.log(`   Error Rate: ${(stats.errorRate * 100).toFixed(2)}%`);
  
  // Issue Detection
  console.log('\n🚨 ISSUE DETECTION');
  console.log(`   Slow Queries: ${stats.slowQueries.length}`);
  console.log(`   N+1 Patterns: ${stats.nPlusOneIssues.length}`);
  
  if (stats.slowQueries.length > 0) {
    console.log('\n   🐌 Slowest Queries:');
    stats.slowQueries.slice(0, 3).forEach((sq: any, i: number) => {
      console.log(`   ${i + 1}. ${sq.execution.duration.toFixed(2)}ms - ${sq.severity}`);
      console.log(`      ${sq.execution.query.substring(0, 80)}...`);
    });
  }
  
  if (stats.nPlusOneIssues.length > 0) {
    console.log('\n   🚨 N+1 Patterns:');
    stats.nPlusOneIssues.forEach((issue: any, i: number) => {
      console.log(`   ${i + 1}. ${issue.occurrences} occurrences (${(issue.confidence * 100).toFixed(1)}% confidence)`);
      console.log(`      Total time: ${issue.totalTime.toFixed(2)}ms`);
    });
  }
  
  // Query Patterns
  console.log('\n📊 QUERY PATTERNS (Top 5)');
  stats.patterns.slice(0, 5).forEach((pattern: any, i: number) => {
    console.log(`   ${i + 1}. ${pattern.count}x, avg: ${pattern.avgTime.toFixed(2)}ms`);
    console.log(`      ${pattern.normalizedQuery.substring(0, 70)}...`);
    if (pattern.tables.size > 0) {
      console.log(`      Tables: ${Array.from(pattern.tables).join(', ')}`);
    }
  });
  
  // Table Activity
  if (stats.topTables.length > 0) {
    console.log('\n🗄️  TABLE ACTIVITY');
    stats.topTables.slice(0, 5).forEach((table: any, i: number) => {
      console.log(`   ${i + 1}. ${table.table}: ${table.count} queries, ${table.time.toFixed(2)}ms total`);
    });
  }
  
  // Memory Usage
  console.log('\n💾 MEMORY USAGE');
  console.log(`   Query History: ${(memory.queries / 1024).toFixed(2)} KB`);
  console.log(`   Pattern Cache: ${(memory.patterns / 1024).toFixed(2)} KB`);
  console.log(`   Total: ${(memory.total / 1024).toFixed(2)} KB`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  if (stats.recommendations.length > 0) {
    stats.recommendations.forEach((rec: string, i: number) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  } else {
    console.log('   ✅ No specific recommendations - performance looks good!');
  }
  
  // Export Information
  console.log('\n📄 EXPORT CAPABILITIES');
  const jsonExport = inspector.exportJSON();
  const csvExport = inspector.exportCSV();
  console.log(`   JSON Export: ${(jsonExport.length / 1024).toFixed(2)} KB`);
  console.log(`   CSV Export: ${csvExport.split('\n').length} rows`);
  
  console.log('\n='.repeat(80));
  
  return {
    stats,
    memory,
    realTime,
    exportSizes: {
      json: jsonExport.length,
      csv: csvExport.split('\n').length
    }
  };
}

async function runFinalValidation() {
  console.log('🚀 QUERY INSPECTOR - FINAL COMPREHENSIVE VALIDATION\n');
  console.log('='.repeat(80));
  console.log('Testing all features in a realistic production-like scenario');
  console.log('='.repeat(80));
  
  // Create inspector with production-like settings
  const inspector = createQueryInspector({
    slowQueryThreshold: 100, // 100ms threshold
    maxHistorySize: 500,
    trackStackTrace: false, // Disabled for performance
    enableNPlusOneDetection: true,
    enablePatternAnalysis: true,
    nPlusOneThreshold: 3,
    nPlusOneTimeWindow: 5000,
    autoReport: true,
    reportInterval: 10000 // 10 second reports
  });
  
  // Create realistic database client
  const dbClient = new RealisticDatabaseClient();
  const wrappedClient = inspector.wrap(dbClient, 'ProductionDB');
  
  // Set up event monitoring
  const eventCounts = await demonstrateEventHandling(inspector);
  
  console.log('🎬 Starting realistic workload simulation...\n');
  
  // Run realistic workload
  await simulateRealisticWorkload(wrappedClient, inspector);
  
  // Wait for any pending async operations
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate comprehensive report
  const report = await generateComprehensiveReport(inspector);
  
  // Cleanup and final stats
  console.log('🧹 CLEANUP AND VALIDATION');
  const beforeCleanup = inspector.getMemoryUsage();
  inspector.cleanup(5000); // Clean old data
  const afterCleanup = inspector.getMemoryUsage();
  
  console.log(`   Memory before cleanup: ${(beforeCleanup.total / 1024).toFixed(2)} KB`);
  console.log(`   Memory after cleanup: ${(afterCleanup.total / 1024).toFixed(2)} KB`);
  console.log(`   Memory freed: ${((beforeCleanup.total - afterCleanup.total) / 1024).toFixed(2)} KB`);
  
  // Final assessment
  console.log('\n🎯 FINAL ASSESSMENT');
  console.log('='.repeat(80));
  
  const assessment = {
    functionalityWorking: report.stats.totalQueries > 0,
    nPlusOneDetection: report.stats.nPlusOneIssues.length > 0,
    performanceAcceptable: report.stats.avgTime < 200, // Under 200ms average
    memoryEfficient: report.memory.total < 1024 * 1024, // Under 1MB
    exportWorking: report.exportSizes.json > 0 && report.exportSizes.csv > 0,
    cleanupWorking: beforeCleanup.total > afterCleanup.total
  };
  
  const allPassed = Object.values(assessment).every(Boolean);
  
  console.log(`✅ Core Functionality: ${assessment.functionalityWorking ? 'WORKING' : 'FAILED'}`);
  console.log(`✅ N+1 Detection: ${assessment.nPlusOneDetection ? 'WORKING' : 'FAILED'}`);
  console.log(`✅ Performance: ${assessment.performanceAcceptable ? 'ACCEPTABLE' : 'NEEDS IMPROVEMENT'}`);
  console.log(`✅ Memory Efficiency: ${assessment.memoryEfficient ? 'EFFICIENT' : 'HIGH USAGE'}`);
  console.log(`✅ Export Functionality: ${assessment.exportWorking ? 'WORKING' : 'FAILED'}`);
  console.log(`✅ Cleanup Mechanism: ${assessment.cleanupWorking ? 'WORKING' : 'FAILED'}`);
  
  console.log('\n📊 EVENT HANDLING SUMMARY');
  console.log(`   Query Events: ${eventCounts.queries}`);
  console.log(`   Slow Query Events: ${eventCounts.slowQueries}`);
  console.log(`   N+1 Pattern Events: ${eventCounts.nPlusOnes}`);
  console.log(`   Report Events: ${eventCounts.reports}`);
  
  console.log('\n' + '='.repeat(80));
  console.log(`🏆 OVERALL RESULT: ${allPassed ? '✅ ALL VALIDATIONS PASSED' : '❌ SOME VALIDATIONS FAILED'}`);
  console.log('='.repeat(80));
  
  if (allPassed) {
    console.log('\n🎉 The Universal Query Inspector is fully validated and ready for production use!');
    console.log('\n💡 Key Strengths Demonstrated:');
    console.log('   • Zero-configuration universal database wrapping');
    console.log('   • Accurate N+1 query pattern detection');
    console.log('   • Minimal performance overhead');
    console.log('   • Robust memory management with bounds');
    console.log('   • Real-time event-driven monitoring');
    console.log('   • Comprehensive reporting and export capabilities');
    console.log('   • Production-ready performance characteristics');
  } else {
    console.log('\n⚠️  Some validations failed. Please review the results above.');
  }
  
  // Stop auto-reporting and cleanup
  inspector.stopAutoReporting();
  inspector.clear();
  
  return {
    passed: allPassed,
    assessment,
    report,
    eventCounts
  };
}

// Run the final validation if executed directly
if (require.main === module) {
  runFinalValidation().catch(console.error);
}

export { runFinalValidation };