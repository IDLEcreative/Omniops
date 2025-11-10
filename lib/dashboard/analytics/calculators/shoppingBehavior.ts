/**
 * Shopping Behavior Calculator
 *
 * Calculates e-commerce related metrics
 */

import { ShoppingBehaviorMetrics } from '../user-analytics';
import { PageView } from '@/types/analytics';
import { cleanUrl, isProductPage } from '../utils/urlUtils';

interface ConversationWithMetadata {
  session_id: string | null;
  created_at: string;
  metadata?: {
    session_metadata?: {
      page_views?: PageView[];
    };
  } | null;
}

export function calculateShoppingBehavior(
  conversations: ConversationWithMetadata[]
): ShoppingBehaviorMetrics {
  const uniqueProducts = new Set<string>();
  let productPageViews = 0;
  let cartPageViews = 0;
  let checkoutPageViews = 0;
  let totalSessions = 0;

  conversations.forEach(conv => {
    const sessionMetadata = conv.metadata?.session_metadata;
    if (sessionMetadata?.page_views) {
      totalSessions++;

      sessionMetadata.page_views.forEach((view: PageView) => {
        const url = view.url.toLowerCase();

        // Detect product pages (common patterns)
        if (isProductPage(url)) {
          productPageViews++;
          uniqueProducts.add(cleanUrl(view.url));
        }

        // Detect cart pages
        if (url.includes('/cart') || url.includes('/basket')) {
          cartPageViews++;
        }

        // Detect checkout pages
        if (url.includes('/checkout') || url.includes('/payment')) {
          checkoutPageViews++;
        }
      });
    }
  });

  const conversionRate = productPageViews > 0
    ? Math.round((checkoutPageViews / productPageViews) * 100)
    : 0;

  const avgProductsPerSession = totalSessions > 0
    ? Math.round((uniqueProducts.size / totalSessions) * 10) / 10
    : 0;

  return {
    product_page_views: productPageViews,
    unique_products_viewed: uniqueProducts.size,
    cart_page_views: cartPageViews,
    checkout_page_views: checkoutPageViews,
    conversion_rate: conversionRate,
    avg_products_per_session: avgProductsPerSession,
  };
}
