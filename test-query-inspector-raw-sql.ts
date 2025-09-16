/**
 * Test Query Inspector with Raw SQL/Generic Database Client
 */

import { createQueryInspector } from './lib/dev-tools';

// Mock database client that simulates raw SQL operations
class MockDatabaseClient {
  constructor(public connectionString: string) {}

  async query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
    // Simulate network delay
    const delay = Math.random() * 200 + 50; // 50-250ms
    await new Promise(resolve => setTimeout(resolve, delay));

    // Parse query type for simulation
    const queryType = sql.trim().split(' ')[0].toUpperCase();
    
    // Simulate different types of results
    switch (queryType) {
      case 'SELECT':
        const rowCount = Math.floor(Math.random() * 100) + 1;
        return {
          rows: Array(rowCount).fill({}).map((_, i) => ({ id: i + 1, data: `row_${i}` })),
          rowCount
        };
      
      case 'INSERT':
      case 'UPDATE':
      case 'DELETE':
        return {
          rows: [],
          rowCount: Math.floor(Math.random() * 10) + 1
        };
      
      default:
        return { rows: [], rowCount: 0 };
    }
  }

  async execute(sql: string, params?: any[]): Promise<{ affectedRows: number }> {
    const delay = Math.random() * 100 + 25;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return { affectedRows: Math.floor(Math.random() * 5) + 1 };
  }

  async transaction(callback: (client: MockDatabaseClient) => Promise<void>): Promise<void> {
    // Simulate transaction overhead
    await new Promise(resolve => setTimeout(resolve, 10));
    await callback(this);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function testRawSQLInspection() {
  console.log('🔍 Testing Query Inspector with Raw SQL Client...\n');

  // Create mock database client
  const rawClient = new MockDatabaseClient('postgresql://localhost:5432/testdb');

  // Create inspector and wrap the client
  const inspector = createQueryInspector({
    slowQueryThreshold: 150, // 150ms threshold
    enableNPlusOneDetection: true,
    enablePatternAnalysis: true,
    nPlusOneThreshold: 3,
    trackStackTrace: true,
    autoReport: false
  });

  const wrappedClient = inspector.wrap(rawClient, 'PostgreSQL');

  // Set up event listeners
  inspector.on('query', (execution) => {
    console.log(`📊 ${execution.method}: ${execution.duration.toFixed(2)}ms`);
    if (execution.rowCount !== undefined) {
      console.log(`   Rows: ${execution.rowCount}`);
    }
    if (execution.affectedRows !== undefined) {
      console.log(`   Affected: ${execution.affectedRows}`);
    }
  });

  inspector.on('slowQuery', (slowQuery) => {
    console.log(`🐌 SLOW QUERY: ${slowQuery.execution.duration.toFixed(2)}ms`);
    console.log(`   SQL: ${slowQuery.execution.query.substring(0, 80)}...`);
    console.log(`   Severity: ${slowQuery.severity}`);
  });

  inspector.on('nPlusOne', (issues) => {
    console.log(`🚨 N+1 DETECTED! ${issues.length} patterns`);
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue.occurrences} occurrences, confidence: ${issue.confidence.toFixed(2)}`);
      console.log(`      Pattern: ${issue.pattern.substring(0, 60)}...`);
    });
  });

  try {
    console.log('1. Testing basic SQL operations...');
    
    // Simple SELECT queries
    await wrappedClient.query('SELECT * FROM users WHERE active = $1', [true]);
    await wrappedClient.query('SELECT id, name, email FROM users ORDER BY created_at DESC LIMIT 10');
    
    console.log('\n2. Testing CRUD operations...');
    
    // INSERT
    await wrappedClient.query(
      'INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW())',
      ['John Doe', 'john@example.com']
    );
    
    // UPDATE
    await wrappedClient.execute(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [123]
    );
    
    // DELETE
    await wrappedClient.execute('DELETE FROM temp_data WHERE created_at < NOW() - INTERVAL \'1 day\'');

    console.log('\n3. Simulating N+1 query pattern...');
    
    // Simulate the classic N+1 problem
    const userIds = [1, 2, 3, 4, 5];
    
    // First query to get users
    await wrappedClient.query('SELECT id, name FROM users WHERE department_id = $1', [1]);
    
    // N queries for each user's details (N+1 pattern)
    for (const userId of userIds) {
      await wrappedClient.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    }

    console.log('\n4. Testing complex queries...');
    
    // Complex JOIN query
    await wrappedClient.query(`
      SELECT u.name, p.title, COUNT(c.id) as comment_count
      FROM users u
      JOIN posts p ON u.id = p.user_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE u.active = true
      GROUP BY u.id, u.name, p.id, p.title
      ORDER BY comment_count DESC
      LIMIT 20
    `);

    // Aggregation query
    await wrappedClient.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as total_orders,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `);

    console.log('\n5. Testing transaction...');
    
    await wrappedClient.transaction(async (client) => {
      await wrappedClient.query('INSERT INTO orders (user_id, total) VALUES ($1, $2)', [1, 99.99]);
      await wrappedClient.query('UPDATE inventory SET quantity = quantity - 1 WHERE product_id = $1', [456]);
      await wrappedClient.query('INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)', [789, 456, 1]);
    });

    console.log('\n6. Simulating some slow queries...');
    
    // These will likely trigger slow query detection due to random delays
    await wrappedClient.query(`
      SELECT u.*, p.*, c.*
      FROM users u
      JOIN posts p ON u.id = p.user_id
      JOIN comments c ON p.id = c.post_id
      WHERE u.created_at > $1
      ORDER BY u.created_at DESC, p.created_at DESC
    `, ['2024-01-01']);

    await wrappedClient.query('SELECT COUNT(*) FROM large_table WHERE complex_calculation(data) > 100');

    // Wait for any pending async operations
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('\n📈 Generating Performance Report...\n');
    
    // Generate comprehensive stats
    const stats = inspector.generateStats();
    
    console.log('=== QUERY PERFORMANCE REPORT ===');
    console.log(`📊 Total Queries: ${stats.totalQueries}`);
    console.log(`⏱️  Total Time: ${stats.totalTime.toFixed(2)}ms`);
    console.log(`📊 Average Time: ${stats.avgTime.toFixed(2)}ms`);
    console.log(`❌ Error Rate: ${(stats.errorRate * 100).toFixed(2)}%`);
    console.log(`🐌 Slow Queries: ${stats.slowQueries.length}`);
    console.log(`🚨 N+1 Issues: ${stats.nPlusOneIssues.length}`);
    
    if (stats.slowQueries.length > 0) {
      console.log('\n🐌 Slow Query Details:');
      stats.slowQueries.slice(0, 3).forEach((sq, i) => {
        console.log(`${i + 1}. ${sq.execution.duration.toFixed(2)}ms - ${sq.severity}`);
        console.log(`   SQL: ${sq.execution.query.substring(0, 80)}...`);
      });
    }

    if (stats.nPlusOneIssues.length > 0) {
      console.log('\n🚨 N+1 Issue Details:');
      stats.nPlusOneIssues.forEach((issue, i) => {
        console.log(`${i + 1}. Pattern: ${issue.pattern.substring(0, 60)}...`);
        console.log(`   Occurrences: ${issue.occurrences}, Total Time: ${issue.totalTime.toFixed(2)}ms`);
        console.log(`   Confidence: ${(issue.confidence * 100).toFixed(1)}%`);
      });
    }

    console.log('\n📊 Query Pattern Analysis:');
    if (stats.patterns.length > 0) {
      stats.patterns.slice(0, 5).forEach((pattern, i) => {
        console.log(`${i + 1}. Count: ${pattern.count}, Avg: ${pattern.avgTime.toFixed(2)}ms`);
        console.log(`   Pattern: ${pattern.normalizedQuery.substring(0, 80)}...`);
        if (pattern.tables.size > 0) {
          console.log(`   Tables: ${Array.from(pattern.tables).join(', ')}`);
        }
      });
    } else {
      console.log('   No patterns detected');
    }

    if (stats.topTables.length > 0) {
      console.log('\n🗄️ Most Active Tables:');
      stats.topTables.slice(0, 5).forEach((table, i) => {
        console.log(`${i + 1}. ${table.table}: ${table.count} queries, ${table.time.toFixed(2)}ms total`);
      });
    }

    console.log('\n💡 Performance Recommendations:');
    if (stats.recommendations.length > 0) {
      stats.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    } else {
      console.log('   No specific recommendations at this time');
    }

    console.log('\n📄 Export Information:');
    const jsonExport = inspector.exportJSON();
    const csvExport = inspector.exportCSV();
    console.log(`JSON Export: ${jsonExport.length} characters`);
    console.log(`CSV Export: ${csvExport.split('\n').length} lines`);

    console.log('\n💾 Memory Usage:');
    const memUsage = inspector.getMemoryUsage();
    console.log(`Query History: ${(memUsage.queries / 1024).toFixed(2)} KB`);
    console.log(`Pattern Cache: ${(memUsage.patterns / 1024).toFixed(2)} KB`);
    console.log(`Total: ${(memUsage.total / 1024).toFixed(2)} KB`);

    console.log('\n📱 Real-time Data:');
    const realTimeData = inspector.getRealTimeData();
    console.log(`Recent Queries: ${realTimeData.recentQueries.length}`);
    console.log(`Last Update: ${new Date(realTimeData.timestamp).toISOString()}`);

    console.log('\n✅ Raw SQL Query Inspector test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    inspector.clear();
    inspector.stopAutoReporting();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRawSQLInspection().catch(console.error);
}

export { testRawSQLInspection };