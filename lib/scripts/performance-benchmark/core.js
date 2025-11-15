import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
export class PerformanceMetrics {
    constructor() {
        this.metrics = {};
    }
    record(name, duration, metadata = {}) {
        if (!this.metrics[name]) {
            this.metrics[name] = { times: [], metadata: [] };
        }
        this.metrics[name].times.push(duration);
        this.metrics[name].metadata.push(metadata);
    }
    getStats(name) {
        const times = this.metrics[name]?.times || [];
        if (times.length === 0)
            return null;
        const sorted = [...times].sort((a, b) => a - b);
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: times.reduce((a, b) => a + b, 0) / times.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            count: times.length
        };
    }
    summary() {
        const results = {};
        for (const [name, data] of Object.entries(this.metrics)) {
            results[name] = this.getStats(name);
        }
        return results;
    }
}
export class PerformanceBenchmark {
    constructor(supabaseUrl, supabaseServiceKey, executeSQL, testDomain = 'thompsonseparts.co.uk') {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
        this.metrics = new PerformanceMetrics();
        this.executeSQL = executeSQL;
        this.testDomain = testDomain;
    }
    getMetrics() {
        return this.metrics;
    }
    async benchmarkEmbeddingSearch(domain) {
        const testQueries = [
            'What products do you sell?',
            'shipping information',
            'return policy',
            'contact details',
            'payment methods accepted'
        ];
        for (const query of testQueries) {
            await this.executeSQL(`DELETE FROM query_cache WHERE query_text = '${query}'`);
            const coldStart = performance.now();
            const coldResult = await this.supabase.rpc('search_content_optimized', {
                query_text: query,
                p_domain_id: domain,
                match_count: 5,
                use_hybrid: true
            });
            const coldTime = performance.now() - coldStart;
            this.metrics.record('embedding_search_cold', coldTime, { query, resultCount: coldResult.data?.length || 0 });
            const warmStart = performance.now();
            await this.supabase.rpc('search_content_optimized', {
                query_text: query,
                p_domain_id: domain,
                match_count: 5,
                use_hybrid: true
            });
            const warmTime = performance.now() - warmStart;
            this.metrics.record('embedding_search_warm', warmTime, { query });
        }
    }
    async benchmarkBulkOperations() {
        const testSizes = [1, 5, 10, 25, 50];
        for (const size of testSizes) {
            const pages = Array.from({ length: size }, (_, i) => ({
                url: `https://benchmark.test/page${i}`,
                title: `Benchmark Page ${i}`,
                content: `Test content for page ${i}`.repeat(100),
                status: 'completed'
            }));
            const singleStart = performance.now();
            for (const page of pages) {
                await this.supabase.from('scraped_pages').upsert(page);
            }
            const singleTime = performance.now() - singleStart;
            this.metrics.record('single_upsert', singleTime / size, { batchSize: size });
            await this.supabase.from('scraped_pages').delete().like('url', 'https://benchmark.test%');
            const bulkStart = performance.now();
            await this.supabase.rpc('bulk_upsert_scraped_pages', { pages });
            const bulkTime = performance.now() - bulkStart;
            this.metrics.record('bulk_upsert', bulkTime / size, { batchSize: size });
            await this.supabase.from('scraped_pages').delete().like('url', 'https://benchmark.test%');
        }
    }
    async benchmarkChatAPI(appUrl) {
        const testMessages = [
            'Hello, what do you sell?',
            'Tell me about your shipping options',
            'I need help with my order #12345',
            'What are your business hours?',
            'How can I return a product?'
        ];
        for (const message of testMessages) {
            const start = performance.now();
            try {
                const response = await fetch(`${appUrl}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        session_id: `benchmark-${Date.now()}`,
                        domain: this.testDomain,
                        config: {
                            features: {
                                websiteScraping: { enabled: true },
                                woocommerce: { enabled: false }
                            }
                        }
                    })
                });
                const data = await response.json();
                const duration = performance.now() - start;
                this.metrics.record('chat_api_response', duration, {
                    message: message.substring(0, 30),
                    hasResponse: !!data.message,
                    sourceCount: data.sources?.length || 0
                });
            }
            catch (error) {
                console.log(`Error for "${message.substring(0, 30)}...": ${error.message}`);
            }
        }
    }
    async checkIndexUsage() {
        const indexQuery = `
      SELECT
        t.tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as size,
        indexdef
      FROM pg_stat_user_indexes i
      JOIN pg_indexes pi ON i.indexname = pi.indexname
      WHERE i.schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 20;
    `;
        return await this.executeSQL(indexQuery);
    }
    async analyzeQueryPlans() {
        const queries = [
            {
                name: 'Embedding Search',
                sql: `EXPLAIN (ANALYZE, BUFFERS)
              SELECT * FROM page_embeddings
              WHERE domain_id = '${this.testDomain}'
              ORDER BY embedding <-> '[0.1,0.2,0.3]'
              LIMIT 5;`
            },
            {
                name: 'Content Search',
                sql: `EXPLAIN (ANALYZE, BUFFERS)
              SELECT * FROM scraped_pages
              WHERE domain = '${this.testDomain}'
              AND content_tsv @@ plainto_tsquery('english', 'test')
              LIMIT 10;`
            }
        ];
        const results = {};
        for (const query of queries) {
            try {
                const result = await this.executeSQL(query.sql);
                const plan = result[0]?.['QUERY PLAN'] || result;
                const execTime = JSON.stringify(plan).match(/execution time: ([\d.]+)/i)?.[1];
                results[query.name] = {
                    executionTime: execTime,
                    usesSeqScan: JSON.stringify(plan).includes('Seq Scan')
                };
            }
            catch (error) {
                results[query.name] = { error: error.message };
            }
        }
        return results;
    }
    async getDomainId() {
        const { data: domainData } = await this.supabase
            .from('customer_configs')
            .select('id')
            .eq('domain', this.testDomain)
            .single();
        return domainData?.id || null;
    }
    saveReport(outputPath) {
        const summary = this.metrics.summary();
        const improvements = this.calculateImprovements(summary);
        const recommendations = this.generateRecommendations(summary);
        const reportPath = outputPath || path.join(process.cwd(), 'performance-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: improvements,
            metrics: summary,
            recommendations
        }, null, 2));
        return reportPath;
    }
    calculateImprovements(summary) {
        const improvements = [];
        if (summary.embedding_search_cold && summary.embedding_search_warm) {
            const cacheImprovement = ((summary.embedding_search_cold.avg - summary.embedding_search_warm.avg) / summary.embedding_search_cold.avg * 100).toFixed(1);
            improvements.push({
                metric: 'Cache Effectiveness',
                improvement: `${cacheImprovement}%`,
                details: `Cold: ${summary.embedding_search_cold.avg.toFixed(2)}ms → Warm: ${summary.embedding_search_warm.avg.toFixed(2)}ms`
            });
        }
        if (summary.single_upsert && summary.bulk_upsert) {
            const bulkImprovement = ((summary.single_upsert.avg - summary.bulk_upsert.avg) / summary.single_upsert.avg * 100).toFixed(1);
            improvements.push({
                metric: 'Bulk Operations',
                improvement: `${bulkImprovement}%`,
                details: `Single: ${summary.single_upsert.avg.toFixed(2)}ms → Bulk: ${summary.bulk_upsert.avg.toFixed(2)}ms per item`
            });
        }
        return improvements;
    }
    generateRecommendations(summary) {
        const recommendations = [];
        if (summary.chat_api_response?.avg > 2000) {
            recommendations.push('⚠️  Chat API responses > 2s - Consider optimizing OpenAI calls or reducing context size');
        }
        if (summary.embedding_search_warm && summary.embedding_search_cold) {
            const cacheRatio = summary.embedding_search_warm.avg / summary.embedding_search_cold.avg;
            if (cacheRatio > 0.8) {
                recommendations.push('⚠️  Cache not providing significant speedup - Check cache implementation');
            }
        }
        if (summary.bulk_upsert?.avg > summary.single_upsert?.avg) {
            recommendations.push('⚠️  Bulk operations slower than single - Review bulk_upsert_scraped_pages function');
        }
        if (recommendations.length === 0) {
            recommendations.push('✅ All metrics within acceptable ranges');
            recommendations.push('✅ Caching is effective (>20% improvement)');
            recommendations.push('✅ Bulk operations are optimized');
        }
        return recommendations;
    }
}
