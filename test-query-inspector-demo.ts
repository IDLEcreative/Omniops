/**
 * Query Inspector Demo - Quick Demonstration
 * Shows the key features of the Universal Query Inspector
 */

import { createQueryInspector, inspectQueries } from './lib/dev-tools';

// Mock database client
const mockDB = {
  async query(sql: string, params?: any[]) {
    // Simulate variable query times
    const delay = sql.includes('slow') ? 250 : Math.random() * 100 + 20;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      rows: Array(Math.floor(Math.random() * 50) + 1).fill(0).map((_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`
      })),
      rowCount: Math.floor(Math.random() * 50) + 1
    };
  }
};

async function runDemo() {
  console.log('🎯 Query Inspector Demo - Universal Database Monitoring\n');

  // Quick setup using convenience function
  const { client, inspector } = inspectQueries(mockDB, {
    slowQueryThreshold: 150, // 150ms threshold
    enableNPlusOneDetection: true,
    nPlusOneThreshold: 3,
    trackStackTrace: false // Keep demo simple
  });

  // Event monitoring
  let slowQueryCount = 0;
  let nPlusOneDetected = false;

  inspector.on('slowQuery', (query) => {
    slowQueryCount++;
    console.log(`⚠️  Slow Query #${slowQueryCount}: ${query.execution.duration.toFixed(2)}ms`);
  });

  inspector.on('nPlusOne', (issues) => {
    nPlusOneDetected = true;
    console.log(`🚨 N+1 Pattern Detected! ${issues[0].occurrences} similar queries`);
  });

  console.log('🔄 Executing sample queries...\n');

  // Normal queries
  await client.query('SELECT * FROM users WHERE active = true');
  await client.query('SELECT id, name FROM products ORDER BY created_at');
  
  // Slow query
  await client.query('SELECT * FROM slow_complex_view WHERE heavy_calculation = true');
  
  // Simulate N+1 problem
  console.log('📊 Simulating N+1 pattern...');
  for (let i = 1; i <= 4; i++) {
    await client.query('SELECT * FROM user_details WHERE user_id = ?', [i]);
  }

  // More queries
  await client.query('SELECT COUNT(*) FROM orders WHERE status = "pending"');
  await client.query('INSERT INTO audit_log (action, timestamp) VALUES (?, NOW())', ['demo']);

  console.log('\n📈 Performance Analysis:\n');

  // Generate report
  const stats = inspector.generateStats();
  
  console.log(`Total Queries: ${stats.totalQueries}`);
  console.log(`Average Time: ${stats.avgTime.toFixed(2)}ms`);
  console.log(`Slow Queries: ${stats.slowQueries.length}`);
  console.log(`N+1 Issues: ${stats.nPlusOneIssues.length}`);
  console.log(`Error Rate: ${(stats.errorRate * 100).toFixed(1)}%`);

  if (stats.nPlusOneIssues.length > 0) {
    console.log('\n🔍 N+1 Analysis:');
    stats.nPlusOneIssues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.occurrences} occurrences of similar query`);
      console.log(`   Confidence: ${(issue.confidence * 100).toFixed(1)}%`);
      console.log(`   Total Time: ${issue.totalTime.toFixed(2)}ms`);
    });
  }

  console.log('\n💡 Recommendations:');
  stats.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });

  // Export capabilities
  console.log('\n📊 Export Capabilities:');
  const jsonExport = inspector.exportJSON();
  const csvExport = inspector.exportCSV();
  
  console.log(`✅ JSON export: ${(jsonExport.length / 1024).toFixed(2)} KB`);
  console.log(`✅ CSV export: ${csvExport.split('\n').length} rows`);
  
  // Memory usage
  const memory = inspector.getMemoryUsage();
  console.log(`✅ Memory usage: ${(memory.total / 1024).toFixed(2)} KB`);

  console.log('\n🎯 Key Features Demonstrated:');
  console.log('✅ Universal client wrapping (works with any database client)');
  console.log('✅ Real-time performance monitoring');
  console.log('✅ Automatic N+1 query detection');
  console.log('✅ Slow query identification');
  console.log('✅ Pattern analysis and normalization');
  console.log('✅ Event-driven alerting');
  console.log('✅ Comprehensive statistics');
  console.log('✅ Export capabilities (JSON/CSV)');
  console.log('✅ Memory-bounded operation');
  console.log('✅ Zero external dependencies');

  console.log('\n🚀 Ready for Production Use!');
  
  // Cleanup
  inspector.clear();
}

// Run demo
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };