/**
 * OpenAI Tool/Function Definitions
 *
 * Defines the tools available to the AI for function calling, including schemas,
 * validation logic, and timeout utilities.
 */

/**
 * OpenAI function calling tool definitions
 */
export const SEARCH_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_website_content",
      description: "Search scraped website content including FAQs, policies, documentation, and general information. Use this for questions about company policies, help articles, guides, and non-product information. DO NOT use this for live product catalog searches when WooCommerce or Shopify is available - use their respective tools instead.",
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
            description: "Maximum number of results to return (default: 100, max: 1000)",
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
      name: "get_product_details",
      description: "Get detailed information about specific products when you need more comprehensive data than the general search provides.",
      parameters: {
        type: "object",
        properties: {
          productQuery: {
            type: "string",
            description: "Specific product query to get detailed information"
          },
          includeSpecs: {
            type: "boolean",
            description: "Whether to include technical specifications in the search",
            default: true
          }
        },
        required: ["productQuery"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "lookup_order",
      description: "Look up an order by order number or ID. Use this when a customer asks about order status, tracking, or order details.",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "The order number or ID to look up"
          }
        },
        required: ["orderId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_complete_page_details",
      description: "Get ALL content from a complete page when you've found something relevant and need comprehensive details. Use this AFTER search_website_content or get_product_details when you need the FULL page. Perfect for getting complete product specs, full documentation, or entire FAQ sections. Returns all chunks from one coherent source.",
      parameters: {
        type: "object",
        properties: {
          pageQuery: {
            type: "string",
            description: "The specific page or item to get complete details for (e.g., product name, doc title, FAQ topic)"
          }
        },
        required: ["pageQuery"]
      }
    }
  }
];

/**
 * Validate tool arguments based on tool name
 * @returns Error message if invalid, null if valid
 */
export function validateToolArguments(toolName: string, toolArgs: Record<string, any>): string | null {
  const ensureString = (value: unknown, field: string) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return `Missing or empty "${field}"`;
    }
    return null;
  };

  switch (toolName) {
    case 'search_website_content':
      return ensureString(toolArgs.query, 'query');
    case 'search_by_category':
      return ensureString(toolArgs.category, 'category');
    case 'get_product_details':
      return ensureString(toolArgs.productQuery, 'productQuery');
    case 'get_complete_page_details':
      return ensureString(toolArgs.pageQuery, 'pageQuery');
    case 'lookup_order':
      return ensureString(toolArgs.orderId, 'orderId');
    case 'woocommerce_operations':
      return ensureString(toolArgs.operation, 'operation');
    default:
      return null;
  }
}

/**
 * Execute a promise with a timeout
 * @param promiseFactory Function that returns the promise to execute
 * @param timeoutMs Timeout in milliseconds
 * @throws Error if the operation times out
 */
export async function runWithTimeout<T>(promiseFactory: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const promise = Promise.resolve().then(promiseFactory);

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('Tool execution timeout')), timeoutMs);
    });

    return await Promise.race([
      promise.then((value) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        return value;
      }),
      timeoutPromise
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    promise.catch(() => {});
  }
}
