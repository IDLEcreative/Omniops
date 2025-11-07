#!/usr/bin/env tsx
/**
 * Database Query Performance Simulation Test
 *
 * Tests real database query performance with various operations to measure
 * the impact of RLS policies, indexes, and query optimization.
 *
 * Expected Results:
 * - Simple count queries: 10-50ms
 * - Indexed queries with filters: 5-20ms
 * - Queries with ordering: 10-30ms
 * - Batched queries: Better than N+1 pattern
 *
 * Tests:
 * 1. Count queries (with RLS)
 * 2. Filtered queries with indexes
 * 3. Ordering and pagination
 * 4. Batched vs N+1 queries
 * 5. Complex aggregations
 *
 * Usage:
 *   npx tsx scripts/tests/simulate-query-performance.ts
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

interface QueryTestResult {
  name: string;
  duration: number;
  rowCount: number;
  avgRowTime?: number;
}

async function measureQuery<T>(
  name: string,
  queryFn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await queryFn();
  const duration = Date.now() - start;
  return { result, duration };
}

async function testQueryPerformance(): Promise<void> {
  console.log('🔬 Database Query Performance Simulation');
  console.log('=====================================\n');

  const results: QueryTestResult[] = [];

  try {
    // Initialize Supabase client
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Supabase client not available - check environment variables');
    }

    console.log('✅ Database connection established\n');

    // Test 1: Simple count query
    console.log('🧪 Test 1: Simple Conversation Count');
    console.log('─'.repeat(60));

    const { result: countResult, duration: countDuration } = await measureQuery(
      'Count all conversations',
      async () => {
        const { count, error } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;
        return count;
      }
    );

    results.push({
      name: 'Count all conversations',
      duration: countDuration,
      rowCount: countResult || 0
    });

    console.log(`Duration: ${countDuration}ms`);
    console.log(`Rows: ${countResult || 0}`);

    // Test 2: Recent conversations with limit (indexed query)
    console.log('\n🧪 Test 2: Recent Conversations (Indexed)');
    console.log('─'.repeat(60));

    const { result: recentResult, duration: recentDuration } = await measureQuery(
      'Recent 20 conversations',
      async () => {
        const { data, error } = await supabase
          .from('conversations')
          .select('id, created_at, status')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        return data;
      }
    );

    results.push({
      name: 'Recent 20 conversations (indexed)',
      duration: recentDuration,
      rowCount: recentResult?.length || 0
    });

    console.log(`Duration: ${recentDuration}ms`);
    console.log(`Rows: ${recentResult?.length || 0}`);

    // Test 3: Filtered query (status filter with index)
    console.log('\n🧪 Test 3: Filtered Query (Status)');
    console.log('─'.repeat(60));

    const { result: filteredResult, duration: filteredDuration } = await measureQuery(
      'Active conversations',
      async () => {
        const { data, error } = await supabase
          .from('conversations')
          .select('id, status, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return data;
      }
    );

    results.push({
      name: 'Active conversations (status filter)',
      duration: filteredDuration,
      rowCount: filteredResult?.length || 0
    });

    console.log(`Duration: ${filteredDuration}ms`);
    console.log(`Rows: ${filteredResult?.length || 0}`);

    // Test 4: Batched query vs N+1 pattern
    console.log('\n🧪 Test 4: Batched Query vs N+1 Pattern');
    console.log('─'.repeat(60));

    // Get 10 conversation IDs first
    const { data: conversationIds } = await supabase
      .from('conversations')
      .select('id')
      .limit(10);

    const ids = conversationIds?.map(c => c.id) || [];

    if (ids.length > 0) {
      // N+1 pattern (BAD)
      console.log('Testing N+1 pattern (sequential)...');
      const n1Start = Date.now();
      const n1Results = [];

      for (const id of ids) {
        const { data } = await supabase
          .from('messages')
          .select('conversation_id, content')
          .eq('conversation_id', id);

        n1Results.push(data);
      }

      const n1Duration = Date.now() - n1Start;
      const n1MessageCount = n1Results.flat().length;

      console.log(`N+1 Duration: ${n1Duration}ms (${ids.length} queries)`);
      console.log(`Messages: ${n1MessageCount}`);

      // Batched query (GOOD)
      console.log('\nTesting batched query...');
      const batchStart = Date.now();

      const { data: batchMessages } = await supabase
        .from('messages')
        .select('conversation_id, content')
        .in('conversation_id', ids);

      const batchDuration = Date.now() - batchStart;

      console.log(`Batched Duration: ${batchDuration}ms (1 query)`);
      console.log(`Messages: ${batchMessages?.length || 0}`);

      const improvement = n1Duration > 0 ? (n1Duration / batchDuration).toFixed(2) : 0;
      console.log(`Performance Improvement: ${improvement}x faster`);

      results.push({
        name: 'N+1 message fetch (sequential)',
        duration: n1Duration,
        rowCount: n1MessageCount,
        avgRowTime: n1MessageCount > 0 ? n1Duration / n1MessageCount : 0
      });

      results.push({
        name: 'Batched message fetch (optimized)',
        duration: batchDuration,
        rowCount: batchMessages?.length || 0,
        avgRowTime: (batchMessages?.length || 0) > 0 ? batchDuration / (batchMessages?.length || 1) : 0
      });
    }

    // Test 5: Aggregation query (count by status)
    console.log('\n🧪 Test 5: Aggregation Query');
    console.log('─'.repeat(60));

    const { result: aggResult, duration: aggDuration } = await measureQuery(
      'Count by status',
      async () => {
        // Get counts for each status
        const statuses = ['active', 'waiting', 'resolved'];
        const counts: Record<string, number> = {};

        for (const status of statuses) {
          const { count } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);

          counts[status] = count || 0;
        }

        return counts;
      }
    );

    const totalAggRows = Object.values(aggResult).reduce((sum, count) => sum + count, 0);

    results.push({
      name: 'Aggregation (count by status)',
      duration: aggDuration,
      rowCount: totalAggRows
    });

    console.log(`Duration: ${aggDuration}ms`);
    console.log(`Results:`, aggResult);

    // Test 6: Date range query (common in analytics)
    console.log('\n🧪 Test 6: Date Range Query (Last 7 Days)');
    console.log('─'.repeat(60));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { result: dateResult, duration: dateDuration } = await measureQuery(
      'Conversations last 7 days',
      async () => {
        const { data, error } = await supabase
          .from('conversations')
          .select('id, created_at')
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      }
    );

    results.push({
      name: 'Date range query (7 days)',
      duration: dateDuration,
      rowCount: dateResult?.length || 0
    });

    console.log(`Duration: ${dateDuration}ms`);
    console.log(`Rows: ${dateResult?.length || 0}`);

    // Print summary
    console.log('\n\n📈 Performance Summary:');
    console.log('=====================================');

    for (const result of results) {
      console.log(`\n${result.name}`);
      console.log(`  Duration:  ${result.duration}ms`);
      console.log(`  Rows:      ${result.rowCount}`);
      if (result.avgRowTime !== undefined) {
        console.log(`  Avg/Row:   ${result.avgRowTime.toFixed(3)}ms`);
      }
    }

    // Calculate averages
    const avgQueryTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const fastestQuery = results.reduce((min, r) => r.duration < min.duration ? r : min);
    const slowestQuery = results.reduce((max, r) => r.duration > max.duration ? r : max);

    console.log('\n📊 Statistics:');
    console.log('=====================================');
    console.log(`Average query time:   ${avgQueryTime.toFixed(2)}ms`);
    console.log(`Fastest query:        ${fastestQuery.name} (${fastestQuery.duration}ms)`);
    console.log(`Slowest query:        ${slowestQuery.name} (${slowestQuery.duration}ms)`);

    // Verification
    console.log('\n✓ Verification:');
    console.log('=====================================');

    const expectations = [
      {
        name: 'Average query time < 200ms',
        expected: true,
        actual: avgQueryTime < 200,
        value: `${avgQueryTime.toFixed(2)}ms`
      },
      {
        name: 'All queries < 500ms',
        expected: true,
        actual: results.every(r => r.duration < 500),
        value: `Max: ${slowestQuery.duration}ms`
      },
      {
        name: 'Indexed queries < 100ms',
        expected: true,
        actual: results.filter(r => r.name.includes('indexed') || r.name.includes('Recent')).every(r => r.duration < 100),
        value: 'Checked'
      },
      {
        name: 'Batched query faster than N+1',
        expected: true,
        actual: (() => {
          const n1 = results.find(r => r.name.includes('N+1'));
          const batched = results.find(r => r.name.includes('Batched'));
          return n1 && batched ? batched.duration < n1.duration : true;
        })(),
        value: (() => {
          const n1 = results.find(r => r.name.includes('N+1'));
          const batched = results.find(r => r.name.includes('Batched'));
          if (n1 && batched) {
            const improvement = (n1.duration / batched.duration).toFixed(2);
            return `${improvement}x faster`;
          }
          return 'N/A';
        })()
      }
    ];

    let allPassed = true;
    for (const expectation of expectations) {
      const status = expectation.actual === expectation.expected ? '✅' : '❌';
      console.log(`${status} ${expectation.name}: ${expectation.value}`);
      if (expectation.actual !== expectation.expected) {
        allPassed = false;
      }
    }

    // Exit with appropriate code
    if (allPassed) {
      console.log('\n✅ All performance tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some performance tests failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testQueryPerformance().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
