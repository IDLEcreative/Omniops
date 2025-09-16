#!/usr/bin/env npx tsx

/**
 * Performance Profiler Usage Examples
 * Shows how to integrate the profiler into any project
 */

import { profileFunction, profiler, PerformanceProfiler } from './lib/dev-tools';

// Example 1: Basic function timing (20 lines approach)
function expensiveCalculation(iterations: number): number {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  return result;
}

// Wrap any function for instant timing
const timedCalculation = profileFunction(expensiveCalculation, 'ExpensiveCalc');

// Example 2: Advanced profiling with custom profiler
class DatabaseService {
  async findUser(id: string): Promise<{ id: string; name: string }> {
    // Simulate database lookup
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    return { id, name: `User-${id}` };
  }

  async createUser(data: { name: string }): Promise<{ id: string; name: string }> {
    // Simulate database write
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150));
    return { id: Math.random().toString(36), name: data.name };
  }

  bulkOperation(count: number): void {
    // Simulate bulk operation
    const data = new Array(count).fill(0).map((_, i) => ({ value: i }));
    data.forEach(item => item.value * 2);
  }
}

// Example 3: API endpoint profiling
function simulateApiEndpoint(path: string): { status: number; data: any } {
  const start = Date.now();
  
  // Simulate different response times based on endpoint
  const delay = path.includes('users') ? 50 : 
                path.includes('posts') ? 100 : 30;
  
  while (Date.now() - start < delay) {
    // Busy wait to simulate work
  }
  
  return { status: 200, data: { message: `Response for ${path}` } };
}

async function demo(): Promise<void> {
  console.log('🔧 Performance Profiler Usage Examples\n');

  // Basic timing demo
  console.log('1. Basic Function Timing:');
  timedCalculation(10000);
  timedCalculation(50000);
  console.log();

  // Advanced profiling demo
  console.log('2. Advanced Profiling with Auto-instrumentation:');
  const dbService = new DatabaseService();
  const profiledDb = profiler.autoInstrument(dbService);

  // Use the profiled service
  await profiledDb.findUser('123');
  await profiledDb.createUser({ name: 'John' });
  profiledDb.bulkOperation(1000);

  // Check stats
  const findUserStats = profiler.getStats('DatabaseService.findUser');
  console.log('findUser performance:', {
    calls: findUserStats?.count,
    avgTime: findUserStats?.avgTime.toFixed(2) + 'ms'
  });
  console.log();

  // Manual timing demo
  console.log('3. Manual Timing for Code Blocks:');
  profiler.start('api-simulation');
  simulateApiEndpoint('/api/users');
  simulateApiEndpoint('/api/posts');
  const apiMetrics = profiler.end('api-simulation');
  console.log('API simulation took:', apiMetrics.duration.toFixed(2) + 'ms');
  console.log();

  // Module instrumentation demo
  console.log('4. Module Instrumentation:');
  const mathUtils = {
    add: (a: number, b: number) => a + b,
    multiply: (a: number, b: number) => a * b,
    factorial: (n: number): number => n <= 1 ? 1 : n * mathUtils.factorial(n - 1)
  };

  const profiledMath = profiler.instrumentModule(mathUtils);
  profiledMath.add(5, 3);
  profiledMath.multiply(4, 7);
  profiledMath.factorial(10);

  console.log('Math operations completed with profiling');
  console.log();

  // Generate comprehensive report
  console.log('5. Performance Report:');
  const report = profiler.generateReport();
  console.log('Report Summary:', {
    totalFunctions: report.summary.totalFunctions,
    totalCalls: report.summary.totalCalls,
    totalTime: report.summary.totalTime.toFixed(2) + 'ms',
    slowestFunctions: report.summary.topBottlenecks.slice(0, 3)
  });

  if (report.recommendations.length > 0) {
    console.log('Recommendations:', report.recommendations);
  }
  console.log();

  // Custom profiler for specific use case
  console.log('6. Custom Profiler Instance:');
  const customProfiler = new PerformanceProfiler({
    trackMemory: true,
    maxHistory: 50,
    enableCallStack: true
  });

  const heavyFunction = customProfiler.wrap((size: number) => {
    return new Array(size).fill(0).map(Math.random);
  }, 'HeavyMemoryFunction');

  heavyFunction(1000);
  heavyFunction(5000);

  const heavyStats = customProfiler.getStats('HeavyMemoryFunction');
  console.log('Heavy function stats:', {
    calls: heavyStats?.count,
    avgMemory: (heavyStats?.avgMemory || 0 / 1024 / 1024).toFixed(2) + 'MB'
  });

  // Export for Chrome DevTools
  const chromeProfile = customProfiler.exportChromeProfile();
  console.log('Chrome profile nodes:', chromeProfile.nodes.length);
  console.log();

  console.log('✨ All examples completed! The profiler is ready for production use.');
  console.log('\n💡 Pro Tips:');
  console.log('   • Use basic profileFunction() for quick debugging');
  console.log('   • Use profiler.wrap() for persistent monitoring');
  console.log('   • Use autoInstrument() for classes and objects');
  console.log('   • Use start()/end() for code blocks');
  console.log('   • Generate reports to identify bottlenecks');
  console.log('   • Export to Chrome DevTools for advanced analysis');
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}