import { getDynamicWooCommerceClient } from './woocommerce-dynamic';

// Define the available WooCommerce functions for the AI
export const woocommerceFunctions = [
  {
    name: 'get_product_info',
    description: 'Get information about a specific product by name or SKU',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Product name or SKU to search for',
        },
      },
      required: ['search'],
    },
  },
  {
    name: 'list_products',
    description: 'List products from the store with optional filtering',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category name',
        },
        in_stock: {
          type: 'boolean',
          description: 'Only show in-stock products',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of products to return (default 10)',
        },
      },
    },
  },
  {
    name: 'check_order_status',
    description: 'Check the status of an order by order number',
    parameters: {
      type: 'object',
      properties: {
        order_number: {
          type: 'string',
          description: 'The order number to check',
        },
      },
      required: ['order_number'],
    },
  },
  {
    name: 'get_shipping_info',
    description: 'Get shipping information and tracking for an order',
    parameters: {
      type: 'object',
      properties: {
        order_number: {
          type: 'string',
          description: 'The order number to get shipping info for',
        },
      },
      required: ['order_number'],
    },
  },
  {
    name: 'check_product_stock',
    description: 'Check the stock level of a specific product',
    parameters: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'Product ID or SKU',
        },
      },
      required: ['product_id'],
    },
  },
];

// Execute WooCommerce functions
export async function executeWooCommerceFunction(
  functionName: string,
  parameters: any,
  domain: string
): Promise<any> {
  const client = await getDynamicWooCommerceClient(domain);
  
  if (!client) {
    return {
      error: 'WooCommerce is not configured for this domain',
    };
  }

  try {
    switch (functionName) {
      case 'get_product_info':
        return await getProductInfo(client, parameters.search);
      
      case 'list_products':
        return await listProducts(client, parameters);
      
      case 'check_order_status':
        return await checkOrderStatus(client, parameters.order_number);
      
      case 'get_shipping_info':
        return await getShippingInfo(client, parameters.order_number);
      
      case 'check_product_stock':
        return await checkProductStock(client, parameters.product_id);
      
      default:
        return { error: `Unknown function: ${functionName}` };
    }
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    return {
      error: `Failed to execute ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Function implementations
async function getProductInfo(client: any, search: string) {
  const products = await client.get('products', {
    search,
    per_page: 1,
  });

  if (!products || products.length === 0) {
    return { message: 'No product found matching your search' };
  }

  const product = products[0];
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    regular_price: product.regular_price,
    sale_price: product.sale_price,
    description: product.short_description || product.description,
    sku: product.sku,
    stock_status: product.stock_status,
    stock_quantity: product.stock_quantity,
    categories: product.categories?.map((c: any) => c.name).join(', '),
    permalink: product.permalink,
    on_sale: product.on_sale,
  };
}

async function listProducts(client: any, params: any) {
  const queryParams: any = {
    per_page: params.limit || 10,
    status: 'publish',
  };

  if (params.in_stock) {
    queryParams.stock_status = 'instock';
  }

  if (params.category) {
    // First, get the category ID
    const categories = await client.get('products/categories', {
      search: params.category,
      per_page: 1,
    });
    
    if (categories && categories.length > 0) {
      queryParams.category = categories[0].id;
    }
  }

  const products = await client.get('products', queryParams);

  return {
    products: products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock_status: p.stock_status,
      sku: p.sku,
      categories: p.categories?.map((c: any) => c.name).join(', '),
    })),
    count: products.length,
  };
}

async function checkOrderStatus(client: any, orderNumber: string) {
  // Try to find the order
  const orders = await client.get('orders', {
    search: orderNumber,
    per_page: 1,
  });

  if (!orders || orders.length === 0) {
    return { message: 'Order not found' };
  }

  const order = orders[0];
  return {
    order_number: order.number,
    status: order.status,
    date_created: order.date_created,
    total: order.total,
    currency: order.currency,
    payment_method: order.payment_method_title,
    items: order.line_items?.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      total: item.total,
    })),
  };
}

async function getShippingInfo(client: any, orderNumber: string) {
  const orders = await client.get('orders', {
    search: orderNumber,
    per_page: 1,
  });

  if (!orders || orders.length === 0) {
    return { message: 'Order not found' };
  }

  const order = orders[0];
  return {
    order_number: order.number,
    shipping_method: order.shipping_lines?.[0]?.method_title || 'Not specified',
    shipping_total: order.shipping_total,
    shipping_address: {
      first_name: order.shipping.first_name,
      last_name: order.shipping.last_name,
      address_1: order.shipping.address_1,
      city: order.shipping.city,
      state: order.shipping.state,
      postcode: order.shipping.postcode,
      country: order.shipping.country,
    },
    tracking_number: order.meta_data?.find((m: any) => m.key === '_tracking_number')?.value || 'Not available yet',
    estimated_delivery: order.meta_data?.find((m: any) => m.key === '_estimated_delivery')?.value || 'Contact support for delivery estimate',
  };
}

async function checkProductStock(client: any, productId: string) {
  let product;
  
  // Try to get by ID first
  try {
    product = await client.get(`products/${productId}`);
  } catch {
    // If not found by ID, try searching by SKU
    const products = await client.get('products', {
      sku: productId,
      per_page: 1,
    });
    
    if (products && products.length > 0) {
      product = products[0];
    }
  }

  if (!product) {
    return { message: 'Product not found' };
  }

  return {
    product_name: product.name,
    sku: product.sku,
    stock_status: product.stock_status,
    stock_quantity: product.stock_quantity || 'Not tracked',
    manage_stock: product.manage_stock,
    backorders: product.backorders,
    in_stock: product.in_stock,
  };
}