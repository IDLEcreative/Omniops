// Broad SKU sweep for variation SKUs and chat verification
// Usage: node test-chat-variation-skus.js [domain] [maxSamples]
// Requires: dev server running on http://localhost:3000 and .env.local configured

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DOMAIN = process.argv[2] || 'thompsonseparts.co.uk';
const MAX_SAMPLES = parseInt(process.argv[3] || '8', 10);

async function getWooConfig(domain) {
  // Prefer config from Supabase customer_configs if available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    try {
      import { createClient  } from '@supabase/supabase-js';
      const s = createClient(supabaseUrl, serviceKey);
      const { data } = await s
        .from('customer_configs')
        .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
        .eq('domain', domain.replace('www.', ''))
        .single();
      if (data && data.woocommerce_url && data.woocommerce_consumer_key && data.woocommerce_consumer_secret) {
        return {
          url: data.woocommerce_url,
          key: data.woocommerce_consumer_key,
          secret: data.woocommerce_consumer_secret,
        };
      }
    } catch {}
  }
  // Fallback to env vars
  return {
    url: process.env.WOOCOMMERCE_URL || 'https://www.thompsonseparts.co.uk',
    key: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
    secret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
  };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}: ${text}`);
  }
  return res.json();
}

async function getVariationSkus(maxSamples) {
  const cfg = await getWooConfig(DOMAIN);
  const WOO_BASE = cfg.url.replace(/\/$/, '');
  const AUTH = `consumer_key=${encodeURIComponent(cfg.key)}&consumer_secret=${encodeURIComponent(cfg.secret)}`;
  const out = [];
  let page = 1;
  while (out.length < maxSamples && page <= 3) { // limit pages for safety
    const products = await fetchJson(`${WOO_BASE}/wp-json/wc/v3/products?type=variable&status=publish&per_page=20&page=${page}&${AUTH}`);
    if (!Array.isArray(products) || products.length === 0) break;
    for (const p of products) {
      if (out.length >= maxSamples) break;
      try {
        const vars = await fetchJson(`${WOO_BASE}/wp-json/wc/v3/products/${p.id}/variations?per_page=50&${AUTH}`);
        const withSku = vars.filter(v => v && typeof v.sku === 'string' && v.sku.trim().length > 0);
        for (const v of withSku) {
          out.push({ sku: v.sku, productId: p.id, variationId: v.id, productName: p.name });
          if (out.length >= maxSamples) break;
        }
      } catch (e) {
        // ignore individual product errors
      }
    }
    page += 1;
  }
  return out;
}

async function testChatForSku(sku) {
  const start = Date.now();
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: sku,
      session_id: `sku-sweep-${Date.now()}`,
      domain: DOMAIN,
      config: { features: { woocommerce: { enabled: true }, websiteScraping: { enabled: true } } },
    })
  });
  const json = await res.json();
  const ms = Date.now() - start;
  const sources = Array.isArray(json.sources) ? json.sources : [];
  const ok = sources.length > 0 && sources.every(s => typeof s.url === 'string' && s.url.includes('thompsonseparts.co.uk'));
  return { ok, ms, sources, message: json.message };
}

(async () => {
  try {
    // Sanity check server
    const smoke = await fetch('http://localhost:3000/api/test-search-lib').catch(() => null);
    if (!smoke || !smoke.ok) {
      console.log('Chat server not reachable at http://localhost:3000. Start it with: npm run dev');
      process.exit(1);
    }

    const cfg = await getWooConfig(DOMAIN);
    const WOO_BASE = cfg.url.replace(/\/$/, '');
    console.log(`Collecting up to ${MAX_SAMPLES} variation SKUs from ${WOO_BASE} ...`);
    const skus = await getVariationSkus(MAX_SAMPLES);
    console.log(`Found ${skus.length} SKUs to test`);

    const results = [];
    for (const { sku, productId, variationId, productName } of skus) {
      process.stdout.write(`Testing ${sku} ... `);
      try {
        const r = await testChatForSku(sku);
        results.push({ sku, productId, variationId, productName, ...r });
        console.log(r.ok ? `OK (${r.ms}ms)` : `FAIL (${r.ms}ms)`);
      } catch (e) {
        results.push({ sku, productId, variationId, productName, ok: false, ms: 0, error: e.message });
        console.log('ERROR');
      }
    }

    const passed = results.filter(r => r.ok).length;
    const failed = results.length - passed;
    const avgMs = Math.round(results.reduce((a, r) => a + (r.ms || 0), 0) / Math.max(results.length, 1));

    console.log('\nSummary');
    console.log(`- Tested: ${results.length}`);
    console.log(`- Passed: ${passed}`);
    console.log(`- Failed: ${failed}`);
    console.log(`- Avg latency: ${avgMs}ms`);

    // Show details for failures and first few passes
    if (failed > 0) {
      console.log('\nFailures:');
      results.filter(r => !r.ok).slice(0, 5).forEach(r => {
        console.log(`  - ${r.sku}: sources=${JSON.stringify(r.sources)} messageSample=${(r.message||'').substring(0,120)}...`);
      });
    }
    console.log('\nSample passes:');
    results.filter(r => r.ok).slice(0, 3).forEach(r => {
      console.log(`  - ${r.sku}: ${r.sources[0]?.url}`);
    });

  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
})();
