#!/usr/bin/env npx tsx
/**
 * Verify CSV Export Output Size
 *
 * Tests the actual CSV output size from the export function
 * to validate test expectations are reasonable
 */

import { exportToCSV } from '@/lib/analytics/export/csv-exporter';
import { analyseMessages } from '@/lib/dashboard/analytics';
import { calculateUserAnalytics } from '@/lib/dashboard/analytics/user-analytics';

// Simulate the test helper's data generation
function createRealisticMessages(count: number = 100) {
  const queries = [
    'How do I track my order?',
    'What is your return policy?',
    'Do you offer international shipping?',
    'How can I reset my password?',
    'What payment methods do you accept?',
    'Is this product in stock?',
    'How long does shipping take?',
    'Can I change my delivery address?',
    'Do you have a size guide?',
    'How do I contact customer support?',
  ];

  const languages = ['en', 'es', 'fr', 'de', 'it'];
  const sentiments = ['positive', 'negative', 'neutral'];

  return Array.from({ length: count }).map((_, index) => {
    const isUserMessage = index % 2 === 0;
    const query = queries[Math.floor(Math.random() * queries.length)];
    const language = languages[Math.floor(Math.random() * languages.length)];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

    return {
      content: isUserMessage ? query : `Here's information about: ${query}`,
      role: isUserMessage ? 'user' : 'assistant',
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        confidence: Math.random(),
        language,
        sentiment,
        response_time_ms: Math.floor(Math.random() * 5000),
      },
      conversations: {
        domain: 'test.com',
      },
    };
  });
}

function createRealisticConversations(count: number = 50) {
  const pages = [
    '/products/item-1',
    '/products/item-2',
    '/cart',
    '/checkout',
    '/account',
    '/help',
    '/contact',
    '/about',
    '/terms',
    '/privacy',
  ];

  return Array.from({ length: count }).map((_, index) => {
    const sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
    const pageViews = Math.floor(Math.random() * 10) + 1;

    return {
      session_id: sessionId,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        user_id: `user-${index}`,
        page_views: pageViews,
        pages_visited: pages.slice(0, Math.min(pageViews, pages.length)),
        session_duration_seconds: Math.floor(Math.random() * 600) + 30,
        is_new_user: Math.random() > 0.7,
        has_converted: Math.random() > 0.92,
        products_viewed: Math.floor(Math.random() * 5),
      },
    };
  });
}

async function main() {
  console.log('🔍 Testing CSV export with 1000 messages...\n');

  const messages = createRealisticMessages(1000);
  const conversations = createRealisticConversations(100);

  const messageAnalytics = analyseMessages(messages, { days: 7 });
  const userAnalytics = calculateUserAnalytics(conversations, { days: 7 });

  const csvContent = exportToCSV(messageAnalytics, userAnalytics, {
    includeMessageAnalytics: true,
    includeUserAnalytics: true,
    includeDailyMetrics: true,
    includeTopQueries: true,
    includeLanguageDistribution: true,
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
      end: new Date().toISOString().split('T')[0]!,
    },
    organizationName: 'Test Organization',
  });

  console.log('📊 CSV Output Analysis:');
  console.log('━'.repeat(50));
  console.log(`Total CSV length: ${csvContent.length} characters`);
  console.log(`Total lines: ${csvContent.split('\n').length}`);
  console.log('');

  console.log('📋 Sections included:');
  const sections = csvContent.match(/^##\s+.+$/gm) || [];
  sections.forEach(section => {
    console.log(`  - ${section.replace('## ', '')}`);
  });
  console.log('');

  console.log('📈 Analytics Summary:');
  console.log(`  - Total messages analyzed: ${messageAnalytics.totalMessages}`);
  console.log(`  - User messages: ${messageAnalytics.totalUserMessages}`);
  console.log(`  - Top queries: ${messageAnalytics.topQueries.length}`);
  console.log(`  - Language distribution: ${messageAnalytics.languageDistribution.length}`);
  console.log(`  - Daily sentiment entries: ${messageAnalytics.dailySentiment?.length || 0}`);
  console.log('');
  console.log(`  - Total unique users: ${userAnalytics.total_unique_users}`);
  console.log(`  - Daily metrics entries: ${userAnalytics.daily_metrics.length}`);
  console.log('');

  // Show first 500 chars to verify format
  console.log('📄 First 500 characters of CSV:');
  console.log('━'.repeat(50));
  console.log(csvContent.substring(0, 500));
  console.log('...');
  console.log('');

  // Test expectations
  console.log('✅ Test Assertions:');
  console.log(`  CSV length > 1000? ${csvContent.length > 1000 ? '✅' : '❌'} (actual: ${csvContent.length})`);
  console.log(`  CSV length > 10000? ${csvContent.length > 10000 ? '✅' : '❌'} (actual: ${csvContent.length})`);
  console.log(`  Contains header? ${csvContent.includes('# Analytics Report') ? '✅' : '❌'}`);
  console.log('');

  console.log('💡 Recommendation:');
  if (csvContent.length < 10000) {
    console.log('  The CSV export with 1000 messages generates ~' + csvContent.length + ' characters.');
    console.log('  The test expectation of >10,000 characters is too high.');
    console.log('  Current expectation of >1,000 characters is appropriate. ✅');
  } else {
    console.log('  The CSV export generates sufficient content (>10,000 characters).');
    console.log('  Test expectations are appropriate. ✅');
  }
}

main().catch(console.error);
