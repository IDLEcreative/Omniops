import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { z } from 'zod';

// Initialize WooCommerce client
export function createWooCommerceClient() {
  const url = process.env.WOOCOMMERCE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!url || !consumerKey || !consumerSecret) {
    // Return null during build time to allow builds without WooCommerce
    if (process.env.NODE_ENV === 'production' && !process.env.BUILDING) {
      throw new Error('WooCommerce credentials are not properly configured');
    }
    return null;
  }

  return new WooCommerceRestApi({
    url,
    consumerKey,
    consumerSecret,
    version: 'wc/v3',
    queryStringAuth: true, // Force Basic Authentication as query string
  });
}

// Product schema
export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  permalink: z.string(),
  type: z.string(),
  status: z.string(),
  description: z.string(),
  short_description: z.string(),
  sku: z.string().optional(),
  price: z.string(),
  regular_price: z.string(),
  sale_price: z.string().optional(),
  stock_quantity: z.number().nullable(),
  stock_status: z.string(),
  categories: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  })),
  images: z.array(z.object({
    id: z.number(),
    src: z.string(),
    alt: z.string(),
  })),
  attributes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    options: z.array(z.string()),
  })),
});

export type Product = z.infer<typeof ProductSchema>;

// Order schema
export const OrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  currency: z.string(),
  total: z.string(),
  date_created: z.string(),
  date_modified: z.string(),
  customer_id: z.number(),
  billing: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
  shipping: z.object({
    first_name: z.string(),
    last_name: z.string(),
    address_1: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  line_items: z.array(z.object({
    id: z.number(),
    name: z.string(),
    product_id: z.number(),
    quantity: z.number(),
    total: z.string(),
  })),
});

export type Order = z.infer<typeof OrderSchema>;

// Customer schema
export const CustomerSchema = z.object({
  id: z.number(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  username: z.string(),
  date_created: z.string(),
  date_modified: z.string(),
  billing: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
  shipping: z.object({
    first_name: z.string(),
    last_name: z.string(),
  }),
});

export type Customer = z.infer<typeof CustomerSchema>;

// Get products with search and filtering
export async function getProducts(params?: {
  search?: string;
  category?: number;
  per_page?: number;
  page?: number;
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'price' | 'popularity' | 'rating';
  order?: 'asc' | 'desc';
  status?: 'any' | 'publish' | 'private' | 'draft';
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
}): Promise<Product[]> {
  const wc = createWooCommerceClient();
  
  try {
    const response = await wc.get('products', {
      per_page: params?.per_page || 20,
      page: params?.page || 1,
      ...params,
    });
    
    return response.data.map((product: any) => ProductSchema.parse(product));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Get single product by ID
export async function getProduct(id: number): Promise<Product> {
  const wc = createWooCommerceClient();
  
  try {
    const response = await wc.get(`products/${id}`);
    return ProductSchema.parse(response.data);
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
}

// Get orders with filtering
export async function getOrders(params?: {
  customer?: number;
  status?: string[];
  after?: string; // ISO8601 date
  before?: string; // ISO8601 date
  per_page?: number;
  page?: number;
}): Promise<Order[]> {
  const wc = createWooCommerceClient();
  
  try {
    const response = await wc.get('orders', {
      per_page: params?.per_page || 20,
      page: params?.page || 1,
      ...params,
    });
    
    return response.data.map((order: any) => OrderSchema.parse(order));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

// Get single order by ID
export async function getOrder(id: number): Promise<Order> {
  const wc = createWooCommerceClient();
  
  try {
    const response = await wc.get(`orders/${id}`);
    return OrderSchema.parse(response.data);
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    throw error;
  }
}

// Get customer by email
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const wc = createWooCommerceClient();
  
  try {
    const response = await wc.get('customers', {
      email,
      per_page: 1,
    });
    
    if (response.data.length === 0) {
      return null;
    }
    
    return CustomerSchema.parse(response.data[0]);
  } catch (error) {
    console.error(`Error fetching customer ${email}:`, error);
    throw error;
  }
}

// Get product categories
export async function getCategories() {
  const wc = createWooCommerceClient();
  
  try {
    const response = await wc.get('products/categories', {
      per_page: 100,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Get product stock status
export async function getProductStock(productId: number) {
  const product = await getProduct(productId);
  
  return {
    inStock: product.stock_status === 'instock',
    quantity: product.stock_quantity,
    status: product.stock_status,
  };
}

// Search products using the Store API approach
export async function searchProducts(query: string, limit: number = 10): Promise<Product[]> {
  const wc = createWooCommerceClient();
  
  try {
    const response = await wc.get('products', {
      search: query,
      per_page: limit,
      status: 'publish',
    });
    
    return response.data.map((product: any) => ProductSchema.parse(product));
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}