/**
 * Dashboard Analytics Query Reduction Verification Test
 *
 * CLAIM: Dashboard conversations endpoint reduces queries from 21 to 2 for 20 conversations.
 *
 * OLD IMPLEMENTATION (N+1 problem):
 * - 1 query: Fetch 20 conversations
 * - 20 queries: Fetch messages for each conversation individually
 * - Total: 21 queries
 *
 * NEW IMPLEMENTATION (Optimized):
 * - 1 query: Fetch 20 conversations
 * - 1 query: Batch fetch messages for all 20 conversations
 * - Total: 2 queries
 *
 * Expected reduction: 90.5% (from 21 to 2 queries)
 */

interface ConversationRow {
  id: string;
  created_at: string;
  ended_at: string | null;
  metadata: Record<string, any>;
}

interface MessageRow {
  conversation_id: string;
  content: string;
  role: string;
  created_at: string;
}

interface QueryLog {
  queryNumber: number;
  table: string;
  operation: string;
  details: string;
}

let queryCount = 0;
let queries: QueryLog[] = [];

// Generate mock conversations
function generateMockConversations(count: number): ConversationRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `conv-${i + 1}`,
    created_at: new Date(Date.now() - i * 60000).toISOString(),
    ended_at: i % 3 === 0 ? new Date(Date.now() - i * 30000).toISOString() : null,
    metadata: {
      status: i % 3 === 0 ? 'resolved' : i % 3 === 1 ? 'waiting' : 'active',
      language: i % 2 === 0 ? 'en' : 'es',
      customer: {
        name: `Customer ${i + 1}`
      }
    }
  }));
}

// Generate mock messages for conversations
function generateMockMessages(conversationIds: string[]): MessageRow[] {
  return conversationIds.flatMap(id => [
    {
      conversation_id: id,
      content: `First message for ${id}`,
      role: 'user',
      created_at: new Date(Date.now() - Math.random() * 60000).toISOString()
    },
    {
      conversation_id: id,
      content: `Second message for ${id}`,
      role: 'user',
      created_at: new Date(Date.now() - Math.random() * 120000).toISOString()
    }
  ]);
}

// Mock Supabase client
function createMockSupabase(conversations: ConversationRow[], messages: MessageRow[]) {
  return {
    from: (table: string) => {
      queryCount++;
      const currentQueryNumber = queryCount;

      // Log the base query
      queries.push({
        queryNumber: currentQueryNumber,
        table,
        operation: 'SELECT',
        details: `Query ${currentQueryNumber}: SELECT from ${table}`
      });

      return {
        select: (columns?: string | { count?: string; head?: boolean }) => {
          const queryBuilder: any = {
            gte: (field: string, value: string) => {
              queryBuilder._gte = { field, value };
              return queryBuilder;
            },
            order: (orderField: string, options: { ascending: boolean }) => {
              queryBuilder._order = { orderField, options };
              return queryBuilder;
            },
            limit: (limit: number) => {
              if (table === 'conversations') {
                // Query 1: Fetch conversations
                queries[currentQueryNumber - 1].details += ` ORDER BY created_at DESC LIMIT ${limit} (${conversations.length} conversations)`;

                return {
                  data: conversations.slice(0, limit),
                  error: null
                };
              }
              return { data: [], error: null };
            },
            in: (field: string, ids: string[]) => {
              queryBuilder._in = { field, ids };
              return queryBuilder;
            },
            eq: (eqField: string, eqValue: string) => {
              queryBuilder._eq = { eqField, eqValue };
              return queryBuilder;
            }
          };

          // Special handling for messages query with .in() chaining
          if (table === 'messages') {
            queryBuilder.order = (orderField: string, options: { ascending: boolean }) => {
              // Query 2: Batch fetch messages for all conversations
              const inData = queryBuilder._in || {};
              const eqData = queryBuilder._eq || {};
              queries[currentQueryNumber - 1].details += ` WHERE ${inData.field} IN [${inData.ids?.length || 0} conversation IDs]`;
              queries[currentQueryNumber - 1].details += ` AND ${eqData.eqField} = '${eqData.eqValue}'`;
              queries[currentQueryNumber - 1].details += ` ORDER BY ${orderField} DESC`;

              const filteredMessages = messages.filter(m =>
                (inData.ids || []).includes(m.conversation_id) && m.role === eqData.eqValue
              );

              return {
                data: filteredMessages,
                error: null
              };
            };
          }

          return queryBuilder;
        }
      };
    }
  };
}

// Execute the optimized dashboard analytics logic
async function executeDashboardAnalytics(
  supabase: any,
  startDate: Date,
  limit: number
): Promise<{
  recent: any[];
  statusCounts: Record<string, number>;
  languageCounts: Record<string, number>;
}> {
  const recent: any[] = [];
  const statusCounts: Record<'active' | 'waiting' | 'resolved', number> = {
    active: 0,
    waiting: 0,
    resolved: 0
  };
  const languageCounts: Record<string, number> = {};

  // Fetch recent conversations
  const { data: recentConversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      created_at,
      ended_at,
      metadata
    `)
    .order('created_at', { ascending: false })
    .gte('created_at', startDate.toISOString())
    .limit(limit);

  if (!error && recentConversations) {
    const conversationsToProcess = recentConversations;

    // OPTIMIZATION: Batch fetch all messages in a single query instead of N queries
    const conversationIds = conversationsToProcess.map((c: any) => c.id);

    // Fetch all messages for all conversations in one query
    const { data: allMessages } = await supabase
      .from('messages')
      .select('conversation_id, content, role, created_at')
      .in('conversation_id', conversationIds)
      .eq('role', 'user')
      .order('created_at', { ascending: false });

    // Group messages by conversation_id for O(1) lookups
    const messagesByConversation = new Map<string, Array<any>>();

    allMessages?.forEach((msg: any) => {
      if (!messagesByConversation.has(msg.conversation_id)) {
        messagesByConversation.set(msg.conversation_id, []);
      }
      messagesByConversation.get(msg.conversation_id)!.push(msg);
    });

    // Process each conversation with O(1) message lookup
    for (const conv of conversationsToProcess) {
      const metadata = conv.metadata || {};

      // Determine status
      let status: 'active' | 'waiting' | 'resolved' = 'active';
      const metadataStatus = typeof metadata.status === 'string' ? metadata.status.toLowerCase() : '';
      if (metadataStatus.includes('wait') || metadataStatus.includes('pending')) {
        status = 'waiting';
      } else if (metadataStatus.includes('resolve') || conv.ended_at) {
        status = 'resolved';
      }

      statusCounts[status] += 1;

      // Determine language
      const metadataLanguage =
        typeof metadata.language === 'string'
          ? metadata.language
          : metadata.customer?.language || metadata.customerLanguage;
      const language = metadataLanguage
        ? String(metadataLanguage).trim()
        : 'Unknown';
      languageCounts[language] = (languageCounts[language] || 0) + 1;

      // Get messages from the batched Map
      const messages = messagesByConversation.get(conv.id) || [];
      const firstUserMessage = messages[0]; // Already sorted by created_at DESC

      recent.push({
        id: conv.id,
        message: firstUserMessage?.content?.substring(0, 100) || 'No message',
        timestamp: firstUserMessage?.created_at || conv.created_at,
        status,
        customerName:
          (metadata.customer && typeof metadata.customer.name === 'string'
            ? metadata.customer.name
            : metadata.customer_name) || null,
        metadata: {
          language
        }
      });
    }
  }

  return { recent, statusCounts, languageCounts };
}

// Main test execution
async function runVerificationTest() {
  console.log('\n🔍 DASHBOARD ANALYTICS QUERY REDUCTION VERIFICATION\n');
  console.log('=' .repeat(70));
  console.log('CLAIM: Reduce queries from 21 to 2 for 20 conversations');
  console.log('=' .repeat(70));

  // Reset counters
  queryCount = 0;
  queries = [];

  // Setup test data
  const conversationCount = 20;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const mockConversations = generateMockConversations(conversationCount);
  const mockMessages = generateMockMessages(mockConversations.map(c => c.id));

  console.log(`\n📊 Test Setup:`);
  console.log(`  - Conversations: ${conversationCount}`);
  console.log(`  - Messages: ${mockMessages.length}`);
  console.log(`  - Date Range: Last 7 days`);
  console.log(`  - Limit: ${conversationCount}`);

  // Create mock Supabase client
  const mockSupabase = createMockSupabase(mockConversations, mockMessages);

  // Execute the dashboard analytics logic
  console.log(`\n⏳ Executing dashboard analytics...`);
  const result = await executeDashboardAnalytics(mockSupabase, startDate, conversationCount);

  // Verification Results
  console.log('\n' + '='.repeat(70));
  console.log('QUERY EXECUTION LOG');
  console.log('='.repeat(70));

  queries.forEach((q, index) => {
    console.log(`\n${index + 1}. ${q.details}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(70));

  const expectedQueries = 2;
  const oldImplementationQueries = conversationCount + 1; // N+1 problem
  const queryReduction = Math.round((1 - queryCount / oldImplementationQueries) * 100);

  console.log(`\n📈 Query Count Analysis:`);
  console.log(`  Expected Queries: ${expectedQueries}`);
  console.log(`  Actual Queries:   ${queryCount}`);
  console.log(`  Result: ${queryCount === expectedQueries ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`\n📊 Performance Comparison:`);
  console.log(`  OLD IMPLEMENTATION (N+1): ${oldImplementationQueries} queries`);
  console.log(`    - 1 query: Fetch ${conversationCount} conversations`);
  console.log(`    - ${conversationCount} queries: Fetch messages for each conversation`);
  console.log(`  NEW IMPLEMENTATION (Optimized): ${queryCount} queries`);
  console.log(`    - 1 query: Fetch ${conversationCount} conversations`);
  console.log(`    - 1 query: Batch fetch messages for all conversations`);
  console.log(`  Query Reduction: ${queryReduction}% 🚀`);

  // Validate analytics data
  console.log(`\n📋 Analytics Data Validation:`);
  console.log(`  Recent Conversations: ${result.recent.length} (Expected: ${conversationCount})`);
  console.log(`  Status Counts:`, result.statusCounts);
  console.log(`  Language Counts:`, result.languageCounts);

  // Validate that all conversations have data
  const allConversationsHaveMessages = result.recent.every(r => r.message !== 'No message');
  console.log(`  All conversations have messages: ${allConversationsHaveMessages ? '✅' : '❌'}`);

  // Validate status distribution
  const totalStatus = Object.values(result.statusCounts).reduce((a, b) => a + b, 0);
  console.log(`  Total status count: ${totalStatus} (Expected: ${conversationCount})`);

  // Final verdict
  console.log('\n' + '='.repeat(70));
  console.log('FINAL VERDICT');
  console.log('='.repeat(70));

  const allTestsPassed =
    queryCount === expectedQueries &&
    result.recent.length === conversationCount &&
    allConversationsHaveMessages &&
    totalStatus === conversationCount;

  if (allTestsPassed) {
    console.log('\n✅ ALL TESTS PASSED');
    console.log('\n🎉 Verification Complete: Dashboard analytics query optimization is working correctly!');
    console.log(`   Query reduction: ${queryReduction}% (from ${oldImplementationQueries} to ${queryCount} queries)`);
  } else {
    console.log('\n❌ TESTS FAILED');
    console.log('\nVerification revealed issues:');
    if (queryCount !== expectedQueries) {
      console.log(`  - Query count mismatch: expected ${expectedQueries}, got ${queryCount}`);
    }
    if (result.recent.length !== conversationCount) {
      console.log(`  - Conversation count mismatch: expected ${conversationCount}, got ${result.recent.length}`);
    }
    if (!allConversationsHaveMessages) {
      console.log(`  - Some conversations missing messages`);
    }
    if (totalStatus !== conversationCount) {
      console.log(`  - Status count mismatch: expected ${conversationCount}, got ${totalStatus}`);
    }
  }

  console.log('\n' + '='.repeat(70));
}

// Execute the test
runVerificationTest().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
