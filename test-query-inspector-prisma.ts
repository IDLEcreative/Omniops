/**
 * Test Query Inspector with Prisma-style ORM
 */

import { createQueryInspector } from './lib/dev-tools';

// Mock Prisma Client for testing
class MockPrismaClient {
  user: UserDelegate;
  post: PostDelegate;
  comment: CommentDelegate;

  constructor() {
    this.user = new UserDelegate();
    this.post = new PostDelegate();
    this.comment = new CommentDelegate();
  }

  async $queryRaw(sql: TemplateStringsArray, ...values: any[]): Promise<any[]> {
    const query = sql.join('?');
    const delay = Math.random() * 300 + 50; // 50-350ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return Array(Math.floor(Math.random() * 20) + 1).fill({}).map((_, i) => ({
      id: i + 1,
      data: `raw_result_${i}`
    }));
  }

  async $executeRaw(sql: TemplateStringsArray, ...values: any[]): Promise<{ count: number }> {
    const query = sql.join('?');
    const delay = Math.random() * 150 + 25;
    await new Promise(resolve => setTimeout(resolve, delay));
    return { count: Math.floor(Math.random() * 10) + 1 };
  }

  $transaction<T>(operations: any[]): Promise<T[]> {
    return Promise.all(operations);
  }

  async simulateQuery(query: string, params: any[], type: string = 'select'): Promise<any> {
    // Simulate database delay
    const delay = Math.random() * 300 + 50; // 50-350ms
    await new Promise(resolve => setTimeout(resolve, delay));

    if (type === 'raw') {
      return Array(Math.floor(Math.random() * 20) + 1).fill({}).map((_, i) => ({
        id: i + 1,
        data: `raw_result_${i}`
      }));
    }

    const count = Math.floor(Math.random() * 50) + 1;
    return Array(count).fill({}).map((_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      createdAt: new Date()
    }));
  }

  async simulateExecution(query: string, params: any[]): Promise<{ count: number }> {
    const delay = Math.random() * 150 + 25;
    await new Promise(resolve => setTimeout(resolve, delay));
    return { count: Math.floor(Math.random() * 10) + 1 };
  }
}

class UserDelegate {
  async findMany(args?: any): Promise<any[]> {
    return new MockPrismaClient().simulateQuery('SELECT * FROM users', [], 'findMany');
  }

  async findUnique(args: { where: any; include?: any }): Promise<any> {
    const results = await new MockPrismaClient().simulateQuery('SELECT * FROM users WHERE id = ?', [args.where.id]);
    return results[0] || null;
  }

  async create(args: { data: any }): Promise<any> {
    await new MockPrismaClient().simulateExecution('INSERT INTO users', []);
    return { id: Math.floor(Math.random() * 1000), ...args.data };
  }

  async update(args: { where: any; data: any }): Promise<any> {
    await new MockPrismaClient().simulateExecution('UPDATE users SET', []);
    return { id: args.where.id, ...args.data };
  }

  async delete(args: { where: any }): Promise<any> {
    await new MockPrismaClient().simulateExecution('DELETE FROM users WHERE', []);
    return { id: args.where.id };
  }

  count(args?: any): Promise<number> {
    return Promise.resolve(Math.floor(Math.random() * 1000) + 100);
  }
}

class PostDelegate {
  async findMany(args?: any): Promise<any[]> {
    return new MockPrismaClient().simulateQuery('SELECT * FROM posts', []);
  }

  async findUnique(args: { where: any }): Promise<any> {
    const results = await new MockPrismaClient().simulateQuery('SELECT * FROM posts WHERE id = ?', [args.where.id]);
    return results[0] || null;
  }

  async create(args: { data: any }): Promise<any> {
    await new MockPrismaClient().simulateExecution('INSERT INTO posts', []);
    return { id: Math.floor(Math.random() * 1000), ...args.data };
  }
}

class CommentDelegate {
  async findMany(args?: any): Promise<any[]> {
    return new MockPrismaClient().simulateQuery('SELECT * FROM comments', []);
  }

  async create(args: { data: any }): Promise<any> {
    await new MockPrismaClient().simulateExecution('INSERT INTO comments', []);
    return { id: Math.floor(Math.random() * 1000), ...args.data };
  }
}

async function testPrismaInspection() {
  console.log('🔍 Testing Query Inspector with Prisma-style ORM...\n');

  // Create mock Prisma client
  const prisma = new MockPrismaClient();

  // Create inspector and wrap the client
  const inspector = createQueryInspector({
    slowQueryThreshold: 200, // 200ms threshold for Prisma
    enableNPlusOneDetection: true,
    enablePatternAnalysis: true,
    nPlusOneThreshold: 3,
    trackStackTrace: true,
    maxHistorySize: 1000
  });

  const wrappedPrisma = inspector.wrap(prisma, 'Prisma');

  // Set up event listeners
  inspector.on('query', (execution) => {
    console.log(`📊 ${execution.method}: ${execution.duration.toFixed(2)}ms`);
    if (execution.rowCount !== undefined) {
      console.log(`   Rows returned: ${execution.rowCount}`);
    }
  });

  inspector.on('slowQuery', (slowQuery) => {
    console.log(`🐌 SLOW QUERY DETECTED: ${slowQuery.execution.duration.toFixed(2)}ms`);
    console.log(`   Method: ${slowQuery.execution.method}`);
    console.log(`   Query: ${slowQuery.execution.query.substring(0, 80)}...`);
    console.log(`   Severity: ${slowQuery.severity}`);
  });

  inspector.on('nPlusOne', (issues) => {
    console.log(`🚨 N+1 QUERY PATTERN DETECTED!`);
    issues.forEach((issue, i) => {
      console.log(`   Pattern ${i + 1}: ${issue.occurrences} similar queries`);
      console.log(`   Confidence: ${(issue.confidence * 100).toFixed(1)}%`);
      console.log(`   Total time: ${issue.totalTime.toFixed(2)}ms`);
    });
  });

  try {
    console.log('1. Testing basic Prisma operations...');
    
    // Basic CRUD operations
    const users = await wrappedPrisma.user.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const userCount = await wrappedPrisma.user.count({
      where: { active: true }
    });

    console.log('\n2. Testing individual record operations...');
    
    const user = await wrappedPrisma.user.findUnique({
      where: { id: 1 },
      include: { posts: true }
    });

    await wrappedPrisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        active: true
      }
    });

    await wrappedPrisma.user.update({
      where: { id: 1 },
      data: { lastLogin: new Date() }
    });

    console.log('\n3. Simulating classic N+1 problem...');
    
    // Get all posts
    const posts = await wrappedPrisma.post.findMany({
      take: 5
    });

    // For each post, get the author (N+1 pattern)
    console.log('   Fetching authors for each post individually...');
    for (const post of (posts as any[])) {
      await wrappedPrisma.user.findUnique({
        where: { id: post.userId || 1 }
      });
    }

    console.log('\n4. Testing relations and includes...');
    
    // Proper way to avoid N+1 with includes
    await wrappedPrisma.post.findMany({
      include: {
        author: true,
        comments: {
          include: {
            author: true
          }
        }
      }
    });

    console.log('\n5. Testing raw queries...');
    
    await wrappedPrisma.$queryRaw`
      SELECT u.name, COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      WHERE u.active = true
      GROUP BY u.id, u.name
      ORDER BY post_count DESC
      LIMIT 10
    `;

    await wrappedPrisma.$executeRaw`
      UPDATE users 
      SET last_active = NOW() 
      WHERE last_active < NOW() - INTERVAL '30 days'
    `;

    console.log('\n6. Testing transaction...');
    
    await wrappedPrisma.$transaction([
      wrappedPrisma.user.create({
        data: { name: 'Transaction User', email: 'tx@example.com' }
      }),
      wrappedPrisma.post.create({
        data: { title: 'Transaction Post', content: 'Created in transaction', userId: 1 }
      }),
      wrappedPrisma.comment.create({
        data: { content: 'Transaction comment', postId: 1, userId: 1 }
      })
    ]);

    console.log('\n7. Testing aggregations and complex queries...');
    
    // Multiple operations that might be slow
    await wrappedPrisma.user.findMany({
      where: {
        posts: {
          some: {
            comments: {
              some: {
                createdAt: {
                  gte: new Date('2024-01-01')
                }
              }
            }
          }
        }
      },
      include: {
        posts: {
          include: {
            comments: true
          }
        }
      }
    });

    // Simulate another potential N+1 with different model
    const comments = await wrappedPrisma.comment.findMany({ take: 4 });
    for (const comment of (comments as any[])) {
      await wrappedPrisma.post.findUnique({
        where: { id: comment.postId || 1 }
      });
    }

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n📈 Generating Prisma Performance Report...\n');
    
    const stats = inspector.generateStats();
    
    console.log('=== PRISMA QUERY INSPECTOR REPORT ===');
    console.log(`📊 Total Operations: ${stats.totalQueries}`);
    console.log(`⏱️  Total Execution Time: ${stats.totalTime.toFixed(2)}ms`);
    console.log(`📊 Average Time per Operation: ${stats.avgTime.toFixed(2)}ms`);
    console.log(`❌ Error Rate: ${(stats.errorRate * 100).toFixed(2)}%`);
    console.log(`🐌 Slow Operations: ${stats.slowQueries.length}`);
    console.log(`🚨 N+1 Patterns Detected: ${stats.nPlusOneIssues.length}`);

    if (stats.slowQueries.length > 0) {
      console.log('\n🐌 Slow Operation Details:');
      stats.slowQueries.slice(0, 3).forEach((sq, i) => {
        console.log(`${i + 1}. ${sq.execution.method}: ${sq.execution.duration.toFixed(2)}ms (${sq.severity})`);
        console.log(`   Operation: ${sq.execution.query.substring(0, 100)}...`);
      });
    }

    if (stats.nPlusOneIssues.length > 0) {
      console.log('\n🚨 N+1 Pattern Analysis:');
      stats.nPlusOneIssues.forEach((issue, i) => {
        console.log(`${i + 1}. Detected Pattern:`);
        console.log(`   Method: ${issue.pattern}`);
        console.log(`   Occurrences: ${issue.occurrences}`);
        console.log(`   Total Time: ${issue.totalTime.toFixed(2)}ms`);
        console.log(`   Confidence: ${(issue.confidence * 100).toFixed(1)}%`);
        console.log(`   💡 Suggestion: Use 'include' or 'select' to fetch related data in a single query`);
      });
    }

    console.log('\n📊 Operation Patterns (Most Frequent):');
    if (stats.patterns.length > 0) {
      stats.patterns.slice(0, 5).forEach((pattern, i) => {
        console.log(`${i + 1}. Count: ${pattern.count}, Avg Time: ${pattern.avgTime.toFixed(2)}ms`);
        console.log(`   Pattern: ${pattern.normalizedQuery.substring(0, 80)}...`);
        if (pattern.methods.size > 0) {
          console.log(`   Methods: ${Array.from(pattern.methods).join(', ')}`);
        }
      });
    }

    if (stats.topTables.length > 0) {
      console.log('\n🗄️ Most Active Models:');
      stats.topTables.slice(0, 5).forEach((table, i) => {
        console.log(`${i + 1}. ${table.table}: ${table.count} operations, ${table.time.toFixed(2)}ms total`);
      });
    }

    console.log('\n💡 Performance Recommendations:');
    if (stats.recommendations.length > 0) {
      stats.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    // Add Prisma-specific recommendations
    if (stats.nPlusOneIssues.length > 0) {
      console.log(`${stats.recommendations.length + 1}. Use Prisma's 'include' or 'select' to fetch related data in single queries`);
    }
    if (stats.slowQueries.length > 0) {
      console.log(`${stats.recommendations.length + 2}. Consider adding database indexes for slow Prisma queries`);
    }

    console.log('\n📄 Export Data:');
    const jsonData = inspector.exportJSON();
    const csvData = inspector.exportCSV();
    console.log(`JSON Export: ${(jsonData.length / 1024).toFixed(2)} KB`);
    console.log(`CSV Export: ${csvData.split('\n').length} rows`);

    console.log('\n💾 Memory Usage:');
    const memUsage = inspector.getMemoryUsage();
    console.log(`Operation History: ${(memUsage.queries / 1024).toFixed(2)} KB`);
    console.log(`Pattern Analysis: ${(memUsage.patterns / 1024).toFixed(2)} KB`);
    console.log(`Total Memory: ${(memUsage.total / 1024).toFixed(2)} KB`);

    console.log('\n✅ Prisma Query Inspector test completed successfully!');
    console.log('\n💡 Integration Tips:');
    console.log('1. Wrap your Prisma client early in your application startup');
    console.log('2. Monitor N+1 patterns in development to catch them early');
    console.log('3. Use the CSV export to analyze query patterns in production');
    console.log('4. Set up alerts for slow queries in your monitoring system');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    inspector.clear();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPrismaInspection().catch(console.error);
}

export { testPrismaInspection };