import { WooCommerceAgent } from '@/lib/agents/woocommerce-agent';
import { QueryCache } from '@/lib/query-cache';
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import { woocommerceFunctions, executeWooCommerceFunction } from '@/lib/woocommerce-chat-functions';
import type { ECommerceProvider, ProviderContextOptions, ContextEnrichments } from '@/lib/providers/base';

export class WooCommerceProvider implements ECommerceProvider {
  key = 'woocommerce' as const;
  agent = new WooCommerceAgent();

  getFunctionSpecs() {
    return woocommerceFunctions;
  }

  async executeFunction(name: string, params: any, domain: string) {
    return executeWooCommerceFunction(name, params, domain);
  }

  async getContextEnrichments(opts: ProviderContextOptions): Promise<ContextEnrichments> {
    const { message, domain, domainId, supabase } = opts;
    const result: ContextEnrichments = {};

    if (!domain) return result;

    try {
      const browseDomain = /localhost|127\.0\.0\.1/i.test(domain)
        ? 'thompsonseparts.co.uk'
        : domain.replace(/^https?:\/\//, '').replace('www.', '');
      const wc = await getDynamicWooCommerceClient(browseDomain);
      if (!wc) return result;

      // Cache categories per domain to avoid repeated API calls
      const categories = await QueryCache.execute(
        {
          key: `woo_categories_${domainId || browseDomain}`,
          domainId: domainId || undefined,
          ttlSeconds: 3600,
          useMemoryCache: true,
          useDbCache: true,
          supabase: supabase
        },
        async () => await wc.getProductCategories({ per_page: 100 })
      );

      // Simple relevance scoring based on token overlap
      const msg = message.toLowerCase();
      const tokens = new Set<string>(msg.split(/[^a-z0-9]+/i).filter(Boolean) as string[]);
      
      // Common words that shouldn't be the sole basis for matching
      const commonWords = new Set(['kit', 'kits', 'set', 'sets', 'part', 'parts', 'tool', 'tools', 'system', 'systems']);
      
      const scored = categories.map((c: any) => {
        const name = (c.name || '').toLowerCase();
        const nameTokens = new Set<string>(name.split(/[^a-z0-9]+/i).filter(Boolean) as string[]);
        let score = 0;
        let commonWordMatches = 0;
        let significantWordMatches = 0;
        
        nameTokens.forEach(t => { 
          if (tokens.has(t)) {
            score += 1;
            if (commonWords.has(t)) {
              commonWordMatches += 1;
            } else {
              significantWordMatches += 1;
            }
          }
        });
        
        // Only penalize if ALL matched words are common words AND no significant words matched
        if (score > 0 && significantWordMatches === 0 && commonWordMatches > 0) {
          score = score * 0.3; // Reduce score by 70% for common-word-only matches
        }
        
        if (score === 0 && name && msg.includes(name)) score += 2; // direct phrase match bonus
        return { cat: c, score };
      }).filter(x => x.score > 0);

      scored.sort((a, b) => b.score - a.score);
      
      // Only show categories with confidence score >= 0.5
      // This prevents weak matches like "kit" matching "Camera Kit Cables"
      // but allows legitimate single-word matches through
      const MIN_CONFIDENCE_THRESHOLD = 0.5;
      const confidentMatches = scored.filter(x => x.score >= MIN_CONFIDENCE_THRESHOLD);
      const top = confidentMatches.slice(0, 2);

      if (top.length > 0) {
        console.log('[WooCommerce] Category matches with confidence:', top.map(x => ({
          name: x.cat.name,
          score: x.score
        })));
        result.matchedCategories = top.map(({ cat }) => ({
          name: cat.name,
          url: `https://${browseDomain}/product-category/${cat.slug}/`
        }));
      } else if (scored.length > 0) {
        console.log('[WooCommerce] Low confidence category matches suppressed:', scored.slice(0, 3).map(x => ({
          name: x.cat.name,
          score: x.score
        })));
      }
    } catch (e) {
      console.warn('[WooCommerceProvider] Category enrichment failed (non-fatal):', e);
    }

    return result;
  }
}

