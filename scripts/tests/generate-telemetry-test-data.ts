/**
 * Test Data Generator for Telemetry Stress Testing
 *
 * Generates realistic failed lookup records to verify the telemetry system under load.
 *
 * Usage: npx tsx scripts/tests/generate-telemetry-test-data.ts
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';

interface TestFailure {
  query: string;
  query_type: 'sku' | 'product_name' | 'order_id' | 'unknown';
  error_type: 'not_found' | 'api_error' | 'timeout' | 'invalid_input';
  platform: string;
  suggestions?: string[];
  timestamp: Date;
}

// Realistic SKU patterns
const SKU_PREFIXES = ['BP', 'HP', 'ZF', 'A4V', 'RX', 'TX', 'LM', 'PD', 'WC', 'SH'];
const SKU_SUFFIXES = ['001', '100', '200', 'X', 'PRO', 'LITE', 'HD', 'XL'];

// Realistic product categories
const PRODUCT_CATEGORIES = [
  'Hydraulic Pumps',
  'Electric Motors',
  'Ball Bearings',
  'Pressure Gauges',
  'Control Valves',
  'Pipe Fittings',
  'Coupling Assemblies',
  'Filter Cartridges',
  'Sealing Rings',
  'Drive Shafts',
  'Mounting Brackets',
  'Relief Valves',
  'Flow Meters',
  'Pneumatic Cylinders',
  'Solenoid Coils'
];

const PRODUCT_DESCRIPTORS = [
  'Heavy Duty',
  'Industrial',
  'Commercial',
  'Premium',
  'Standard',
  'Professional',
  'High Pressure',
  'Low Profile',
  'Compact',
  'Universal'
];

function generateRandomSKU(): string {
  const prefix = SKU_PREFIXES[Math.floor(Math.random() * SKU_PREFIXES.length)];
  const middle = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  const suffix = SKU_SUFFIXES[Math.floor(Math.random() * SKU_SUFFIXES.length)];

  // 70% with suffix, 30% without
  if (Math.random() < 0.7) {
    return `${prefix}-${middle}-${suffix}`;
  }
  return `${prefix}-${middle}`;
}

function generateRandomProductName(): string {
  const descriptor = PRODUCT_DESCRIPTORS[Math.floor(Math.random() * PRODUCT_DESCRIPTORS.length)];
  const category = PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)];

  // 60% with descriptor, 40% without
  if (Math.random() < 0.6) {
    return `${descriptor} ${category}`;
  }
  return category;
}

function generateRandomOrderId(): string {
  const prefix = Math.random() < 0.5 ? 'ORD' : 'WC';
  const number = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
  return `${prefix}-${number}`;
}

function generateSuggestions(query: string, errorType: string): string[] | undefined {
  // 40% of not_found errors have suggestions (fuzzy match simulation)
  if (errorType !== 'not_found' || Math.random() > 0.4) {
    return undefined;
  }

  const suggestions: string[] = [];
  const numSuggestions = Math.floor(Math.random() * 3) + 1; // 1-3 suggestions

  for (let i = 0; i < numSuggestions; i++) {
    // Generate similar SKUs/products
    if (query.includes('-')) {
      suggestions.push(generateRandomSKU());
    } else {
      suggestions.push(generateRandomProductName());
    }
  }

  return suggestions;
}

function getRandomTimestamp(): Date {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 50% in last 24 hours, 50% in last 7 days
  if (Math.random() < 0.5) {
    const timeRange = now.getTime() - oneDayAgo.getTime();
    return new Date(oneDayAgo.getTime() + Math.random() * timeRange);
  } else {
    const timeRange = oneDayAgo.getTime() - sevenDaysAgo.getTime();
    return new Date(sevenDaysAgo.getTime() + Math.random() * timeRange);
  }
}

function generateTestFailures(count: number): TestFailure[] {
  const failures: TestFailure[] = [];
  const commonQueries: string[] = []; // Track some queries to repeat

  for (let i = 0; i < count; i++) {
    // Determine query type
    const rand = Math.random();
    let queryType: TestFailure['query_type'];
    let query: string;

    if (rand < 0.70) {
      queryType = 'sku';
      // 20% reuse common queries
      if (commonQueries.length > 0 && Math.random() < 0.2) {
        query = commonQueries[Math.floor(Math.random() * commonQueries.length)];
      } else {
        query = generateRandomSKU();
        // 10% chance to add to common queries
        if (Math.random() < 0.1) {
          commonQueries.push(query);
        }
      }
    } else if (rand < 0.95) {
      queryType = 'product_name';
      query = generateRandomProductName();
    } else {
      queryType = 'order_id';
      query = generateRandomOrderId();
    }

    // Determine error type
    const errorRand = Math.random();
    let errorType: TestFailure['error_type'];
    if (errorRand < 0.60) {
      errorType = 'not_found';
    } else if (errorRand < 0.90) {
      errorType = 'api_error';
    } else if (errorRand < 0.98) {
      errorType = 'timeout';
    } else {
      errorType = 'invalid_input';
    }

    // Determine platform
    const platformRand = Math.random();
    let platform: string;
    if (platformRand < 0.50) {
      platform = 'woocommerce';
    } else if (platformRand < 0.80) {
      platform = 'shopify';
    } else {
      platform = 'semantic';
    }

    failures.push({
      query,
      query_type: queryType,
      error_type: errorType,
      platform,
      suggestions: generateSuggestions(query, errorType),
      timestamp: getRandomTimestamp()
    });
  }

  return failures;
}

async function insertTestData(failures: TestFailure[]): Promise<void> {
  const supabase = createServiceRoleClientSync();

  // Insert in batches of 100 for better performance
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < failures.length; i += batchSize) {
    const batch = failures.slice(i, i + batchSize);

    const { error } = await supabase
      .from('lookup_failures')
      .insert(
        batch.map(f => ({
          query: f.query,
          query_type: f.query_type,
          error_type: f.error_type,
          platform: f.platform,
          suggestions: f.suggestions || null,
          created_at: f.timestamp.toISOString()
        }))
      );

    if (error) {
      throw new Error(`Failed to insert batch: ${error.message}`);
    }

    inserted += batch.length;
    process.stdout.write(`\rInserting test data: ${inserted}/${failures.length}`);
  }

  console.log(); // New line after progress
}

function analyzeDistribution(failures: TestFailure[]): void {
  const stats = {
    queryTypes: {} as Record<string, number>,
    errorTypes: {} as Record<string, number>,
    platforms: {} as Record<string, number>,
    withSuggestions: 0
  };

  for (const failure of failures) {
    stats.queryTypes[failure.query_type] = (stats.queryTypes[failure.query_type] || 0) + 1;
    stats.errorTypes[failure.error_type] = (stats.errorTypes[failure.error_type] || 0) + 1;
    stats.platforms[failure.platform] = (stats.platforms[failure.platform] || 0) + 1;
    if (failure.suggestions && failure.suggestions.length > 0) {
      stats.withSuggestions++;
    }
  }

  console.log('\n📊 Test Data Distribution:');
  console.log('\nQuery Types:');
  for (const [type, count] of Object.entries(stats.queryTypes)) {
    console.log(`  ${type}: ${count} (${((count / failures.length) * 100).toFixed(1)}%)`);
  }

  console.log('\nError Types:');
  for (const [type, count] of Object.entries(stats.errorTypes)) {
    console.log(`  ${type}: ${count} (${((count / failures.length) * 100).toFixed(1)}%)`);
  }

  console.log('\nPlatforms:');
  for (const [platform, count] of Object.entries(stats.platforms)) {
    console.log(`  ${platform}: ${count} (${((count / failures.length) * 100).toFixed(1)}%)`);
  }

  console.log(`\nRecords with suggestions: ${stats.withSuggestions} (${((stats.withSuggestions / failures.length) * 100).toFixed(1)}%)`);
}

async function main() {
  console.log('🚀 Generating test data for telemetry stress testing...\n');

  const recordCount = 500;

  // Generate test failures
  console.log(`📝 Generating ${recordCount} test records...`);
  const failures = generateTestFailures(recordCount);

  // Show distribution
  analyzeDistribution(failures);

  // Insert into database
  console.log('\n💾 Inserting test data into database...');
  try {
    await insertTestData(failures);
    console.log(`✅ Successfully inserted ${failures.length} test records`);
  } catch (error) {
    console.error('❌ Failed to insert test data:', error);
    process.exit(1);
  }

  // Verify insertion
  console.log('\n🔍 Verifying insertion...');
  const supabase = createServiceRoleClientSync();
  const { data, error, count } = await supabase
    .from('lookup_failures')
    .select('error_type', { count: 'exact', head: false })
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Database verification successful');
  console.log(`Total records in last 7 days: ${count || 0}`);

  console.log('\n✨ Test data generation complete!');
}

main().catch(console.error);
