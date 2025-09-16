/**
 * Test Query Inspector with Supabase Client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createQueryInspector, inspectQueries } from './lib/dev-tools';

// Mock Supabase client for testing (replace with real credentials for actual testing)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

interface TestRow {
  id: number;
  name: string;
  email: string;
}

async function testSupabaseInspection() {
  console.log('🔍 Testing Query Inspector with Supabase...\n');

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Wrap with query inspector using quick method
  const { client: inspectedClient, inspector } = inspectQueries(supabase, {
    slowQueryThreshold: 100, // 100ms threshold for testing
    enableNPlusOneDetection: true,
    enablePatternAnalysis: true,
    nPlusOneThreshold: 2, // Lower threshold for testing
    trackStackTrace: true
  });

  // Set up event listeners
  inspector.on('query', (execution) => {
    console.log(`📊 Query executed: ${execution.method} - ${execution.duration.toFixed(2)}ms`);
    if (execution.table) {
      console.log(`   Table: ${execution.table}`);
    }
  });

  inspector.on('slowQuery', (slowQuery) => {
    console.log(`🐌 Slow query detected: ${slowQuery.execution.duration.toFixed(2)}ms`);
    console.log(`   Query: ${slowQuery.execution.query.substring(0, 100)}...`);
  });

  inspector.on('nPlusOne', (issues) => {
    console.log(`🚨 N+1 query detected! ${issues.length} patterns found`);
    issues.forEach((issue, i) => {
      console.log(`   Pattern ${i + 1}: ${issue.occurrences} occurrences (${issue.confidence.toFixed(2)} confidence)`);
    });
  });

  try {
    console.log('1. Testing basic SELECT queries...');
    
    // Simulate some queries that would work on a typical database
    // Note: These might fail if the table doesn't exist, but we're testing the wrapper
    
    // Simple select
    try {
      await inspectedClient
        .from('users')
        .select('*')
        .limit(10);
    } catch (error) {
      console.log('   (Query failed as expected - testing wrapper only)');
    }

    // Simulate N+1 pattern by making similar queries
    console.log('\n2. Simulating potential N+1 pattern...');
    for (let i = 0; i < 3; i++) {
      try {
        await inspectedClient
          .from('users')
          .select('name, email')
          .eq('id', i + 1);
      } catch (error) {
        // Ignore errors, we're testing the wrapper
      }
    }

    // Different query patterns
    console.log('\n3. Testing different query patterns...');
    try {
      await inspectedClient
        .from('posts')
        .select('title, content')
        .eq('user_id', 1);
    } catch (error) {
      // Ignore errors
    }

    try {
      await inspectedClient
        .from('comments')
        .select('*')
        .eq('post_id', 1);
    } catch (error) {
      // Ignore errors
    }

    // Simulate a slow operation with artificial delay
    console.log('\n4. Simulating slow query...');
    const originalFrom = inspectedClient.from;
    inspectedClient.from = function(table: string) {
      const query = originalFrom.call(this, table);
      const originalSelect = query.select;
      query.select = function(...args: any[]) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(originalSelect.apply(this, args));
          }, 150); // 150ms delay to trigger slow query detection
        });
      };
      return query;
    };

    try {
      await inspectedClient
        .from('slow_table')
        .select('*');
    } catch (error) {
      // Ignore errors
    }

    // Wait a moment for any async processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n📈 Generating Performance Report...\n');
    
    // Generate and display stats
    const stats = inspector.generateStats();
    
    console.log('=== QUERY INSPECTOR REPORT ===');
    console.log(`Total Queries: ${stats.totalQueries}`);
    console.log(`Total Time: ${stats.totalTime.toFixed(2)}ms`);
    console.log(`Average Time: ${stats.avgTime.toFixed(2)}ms`);
    console.log(`Error Rate: ${(stats.errorRate * 100).toFixed(2)}%`);
    console.log(`Slow Queries: ${stats.slowQueries.length}`);
    console.log(`N+1 Issues: ${stats.nPlusOneIssues.length}`);
    
    if (stats.patterns.length > 0) {
      console.log('\n📊 Query Patterns:');
      stats.patterns.slice(0, 5).forEach((pattern, i) => {
        console.log(`${i + 1}. ${pattern.normalizedQuery.substring(0, 60)}...`);
        console.log(`   Count: ${pattern.count}, Avg Time: ${pattern.avgTime.toFixed(2)}ms`);
      });
    }

    if (stats.topTables.length > 0) {
      console.log('\n🗄️ Top Tables by Time:');
      stats.topTables.slice(0, 3).forEach((table, i) => {
        console.log(`${i + 1}. ${table.table}: ${table.count} queries, ${table.time.toFixed(2)}ms total`);
      });
    }

    if (stats.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      stats.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    console.log('\n📄 Export Capabilities:');
    console.log('JSON export length:', inspector.exportJSON().length, 'characters');
    console.log('CSV export lines:', inspector.exportCSV().split('\n').length);

    console.log('\n💾 Memory Usage:');
    const memUsage = inspector.getMemoryUsage();
    console.log(`Queries: ${memUsage.queries} bytes`);
    console.log(`Patterns: ${memUsage.patterns} bytes`);
    console.log(`Total: ${memUsage.total} bytes`);

    console.log('\n✅ Supabase Query Inspector test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    inspector.clear();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSupabaseInspection().catch(console.error);
}

export { testSupabaseInspection };