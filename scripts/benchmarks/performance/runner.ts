import { initSupabaseClient } from './supabase';
import { benchmarkEmbeddingSearch } from './embedding';
import { benchmarkBulkOperations } from './bulk';
import { benchmarkQueryCache } from './cache';
import { benchmarkChatAPI } from './chat';
import { checkIndexUsage } from './index-usage';
import { analyzeQueryPlans } from './query-plans';
import { generateReport } from './report';
import { PerformanceMetrics } from './metrics';
import { TEST_DOMAIN } from './config';

export async function runPerformanceBenchmark() {
  const supabase = await initSupabaseClient();
  const metrics = new PerformanceMetrics();

  console.log('🚀 Starting Comprehensive Performance Benchmark');
  console.log('='.repeat(80));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Test Domain: ${TEST_DOMAIN}`);
  console.log('='.repeat(80));

  const { data: domainData } = await supabase.from('customer_configs').select('id').eq('domain', TEST_DOMAIN).single();
  const domainId = domainData?.id;
  if (!domainId) {
    console.log(`⚠️  Domain ${TEST_DOMAIN} not found`);
    return;
  }

  await benchmarkEmbeddingSearch(supabase, metrics, domainId);
  await benchmarkBulkOperations(supabase, metrics);
  await benchmarkQueryCache(supabase, metrics);
  await benchmarkChatAPI(metrics);
  await checkIndexUsage();
  await analyzeQueryPlans();
  generateReport(metrics);
}
