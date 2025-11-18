/**
 * Get Available Tools Based on Customer Configuration
 *
 * Dynamically determines which tools should be available to the AI
 * based on the customer's configured integrations.
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { WOOCOMMERCE_TOOL } from './woocommerce-tool';
import { SHOPIFY_TOOL } from './shopify-tool';

export interface ToolAvailability {
  hasWooCommerce: boolean;
  hasShopify: boolean;
}

/**
 * Check which e-commerce platforms are configured for a domain
 */
export async function checkToolAvailability(domain: string): Promise<ToolAvailability> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return { hasWooCommerce: false, hasShopify: false };
    }

    // Check customer configuration in database
    const { data, error } = await supabase
      .from('customer_configs')
      .select('woocommerce_url, shopify_shop')
      .eq('domain', domain)
      .single();

    if (error || !data) {
      // No configuration found for this domain - NO tools available
      // Environment variables are only used for the primary customer domain

      // Extract domain from WOOCOMMERCE_URL if set
      let envWooCommerceDomain = '';
      if (process.env.WOOCOMMERCE_URL) {
        try {
          const url = new URL(process.env.WOOCOMMERCE_URL);
          envWooCommerceDomain = url.hostname.replace(/^www\./, ''); // Remove www. prefix
        } catch (e) {
          // Invalid URL, ignore
        }
      }

      // Check if this domain matches any of the primary/test domains
      const normalizedDomain = domain.replace(/^www\./, ''); // Remove www. prefix
      const isDefaultDomain = normalizedDomain === process.env.TEST_DOMAIN ||
                             normalizedDomain === process.env.DEFAULT_DOMAIN ||
                             normalizedDomain === process.env.PRIMARY_CUSTOMER_DOMAIN ||
                             normalizedDomain === process.env.PRIMARY_DOMAIN ||
                             normalizedDomain === envWooCommerceDomain; // Match WooCommerce URL domain

      if (isDefaultDomain) {
        // Only use environment variables for the primary/test domain
        return {
          hasWooCommerce: Boolean(
            process.env.WOOCOMMERCE_URL &&
            process.env.WOOCOMMERCE_CONSUMER_KEY &&
            process.env.WOOCOMMERCE_CONSUMER_SECRET
          ),
          hasShopify: Boolean(
            process.env.SHOPIFY_SHOP &&
            process.env.SHOPIFY_ACCESS_TOKEN
          )
        };
      }

      // For any other domain without configuration, NO e-commerce tools
      return {
        hasWooCommerce: false,
        hasShopify: false
      };
    }

    return {
      hasWooCommerce: Boolean(data.woocommerce_url),
      hasShopify: Boolean(data.shopify_shop)
    };
  } catch (error) {
    console.error('[Tool Availability] Error checking configuration:', error);
    return { hasWooCommerce: false, hasShopify: false };
  }
}

/**
 * Get the list of tools available for the AI based on customer configuration
 */
export async function getAvailableTools(domain: string): Promise<any[]> {
  const availability = await checkToolAvailability(domain);

  // Base search tools that are always available
  const tools = [
    {
      type: "function" as const,
      function: {
        name: "search_website_content",
        description: "Search scraped website content including product pages, FAQs, policies, documentation, and general information. For PRODUCT queries, use this IN PARALLEL with woocommerce_operations or shopify_operations to get both live catalog data AND rich page content. For NON-PRODUCT queries (policies, help, guides), use this tool alone.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query for website content. Should match the information the user is seeking."
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 100, max: 1000)",
              default: 100,
              minimum: 1,
              maximum: 1000
            }
          },
          required: ["query"]
        }
      }
    },
    {
      type: "function" as const,
      function: {
        name: "search_by_category",
        description: "Search for content by category or topic area. Use this when the user asks about general topics or wants to browse categories.",
        parameters: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "The category to search (e.g., 'contact information', 'shipping policy', 'installation guides')"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 100)",
              default: 100,
              minimum: 1,
              maximum: 1000
            }
          },
          required: ["category"]
        }
      }
    },
    {
      type: "function" as const,
      function: {
        name: "search_similar",
        description: "Find products similar to a given item. Use this when the user asks for alternatives or items 'like' something specific.",
        parameters: {
          type: "object",
          properties: {
            productQuery: {
              type: "string",
              description: "The name or description of the product to find similar items to"
            },
            limit: {
              type: "number",
              description: "Maximum number of similar items to return (default: 100)",
              default: 100,
              minimum: 1,
              maximum: 1000
            }
          },
          required: ["productQuery"]
        }
      }
    }
  ];

  // Only add WooCommerce tool if the customer has it configured
  if (availability.hasWooCommerce) {
    console.log('[Tool Availability] WooCommerce is configured - adding cart operations');
    tools.push(WOOCOMMERCE_TOOL);
  } else {
    console.log('[Tool Availability] WooCommerce not configured - cart operations disabled');
  }

  // Add Shopify tool if the customer has it configured
  if (availability.hasShopify) {
    console.log('[Tool Availability] Shopify is configured - adding cart operations');
    tools.push(SHOPIFY_TOOL);
  } else {
    console.log('[Tool Availability] Shopify not configured - cart operations disabled');
  }

  return tools;
}

/**
 * Get system prompt additions based on available tools
 */
export function getToolInstructions(availability: ToolAvailability): string {
  const instructions: string[] = [];

  if (!availability.hasWooCommerce && !availability.hasShopify) {
    instructions.push(
      "⚠️ E-commerce operations are NOT available for this customer.",
      "DO NOT offer to add items to cart, check orders, or perform any commerce operations.",
      "Focus on providing information about products and answering questions."
    );
  }

  if (availability.hasWooCommerce) {
    instructions.push(
      "✅ WooCommerce is configured - you can perform cart operations, check orders, and manage the shopping experience.",
      "For PRODUCT searches: Use woocommerce_operations AND search_website_content IN PARALLEL to get complete information.",
      "For cart/order operations: Use woocommerce_operations alone."
    );
  }

  if (availability.hasShopify) {
    instructions.push(
      "✅ Shopify is configured - you can perform cart operations, check orders, and manage the shopping experience.",
      "For PRODUCT searches: Use shopify_operations AND search_website_content IN PARALLEL to get complete information.",
      "For cart/order operations: Use shopify_operations alone."
    );
  }

  return instructions.join("\n");
}