/**
 * Mock WooCommerce data for testing when authentication fails
 * This allows the chatbot to function during development
 */

export class WooCommerceMockData {
  private static mockOrders = [
    {
      id: 119410,
      number: "119410",
      status: "processing" as const,
      date_created: "2024-01-15T10:30:00",
      date_modified: "2024-01-15T10:30:00",
      parent_id: 0,
      order_key: "wc_order_mock_119410",
      created_via: "checkout",
      version: "8.0.0",
      date_paid: null,
      date_completed: null,
      cart_hash: "mock_hash_119410",
      customer_ip_address: "192.168.1.1",
      customer_user_agent: "Mozilla/5.0",
      total: "125.99",
      total_tax: "25.20",
      discount_total: "0.00",
      discount_tax: "0.00",
      shipping_total: "10.00",
      shipping_tax: "2.00",
      prices_include_tax: false,
      currency: "GBP",
      customer_id: 12345,
      payment_method: "stripe",
      payment_method_title: "Credit Card",
      transaction_id: "",
      billing: {
        first_name: "Sam",
        last_name: "Guy",
        company: "",
        email: "customer@example.com",
        phone: "07700900000",
        address_1: "123 Test Street",
        address_2: "",
        city: "London",
        state: "",
        postcode: "SW1A 1AA",
        country: "GB"
      },
      shipping: {
        first_name: "Sam",
        last_name: "Guy",
        company: "",
        address_1: "123 Test Street",
        address_2: "",
        city: "London",
        state: "",
        postcode: "SW1A 1AA",
        country: "GB"
      },
      line_items: [
        {
          id: 1,
          name: "Brake Pads Set",
          product_id: 101,
          variation_id: 0,
          quantity: 2,
          tax_class: "",
          subtotal: "89.98",
          subtotal_tax: "17.99",
          total: "89.98",
          total_tax: "17.99",
          taxes: [],
          meta_data: [],
          sku: "BP-001",
          price: 44.99
        },
        {
          id: 2,
          name: "Oil Filter",
          product_id: 102,
          variation_id: 0,
          quantity: 1,
          tax_class: "",
          subtotal: "36.01",
          subtotal_tax: "7.20",
          total: "36.01",
          total_tax: "7.20",
          taxes: [],
          meta_data: [],
          sku: "OF-002",
          price: 36.01
        }
      ],
      tax_lines: [],
      shipping_lines: [],
      fee_lines: [],
      coupon_lines: [],
      refunds: [],
      meta_data: [],
      customer_note: "Please deliver to side entrance"
    },
    {
      id: 119411,
      number: "119411",
      status: "completed" as const,
      date_created: "2024-01-10T14:20:00",
      date_modified: "2024-01-12T09:15:00",
      parent_id: 0,
      order_key: "wc_order_mock_119411",
      created_via: "checkout",
      version: "8.0.0",
      date_paid: "2024-01-10T14:25:00",
      date_completed: "2024-01-12T09:15:00",
      cart_hash: "mock_hash_119411",
      customer_ip_address: "192.168.1.1",
      customer_user_agent: "Mozilla/5.0",
      total: "67.50",
      total_tax: "13.50",
      discount_total: "0.00",
      discount_tax: "0.00",
      shipping_total: "5.00",
      shipping_tax: "1.00",
      prices_include_tax: false,
      currency: "GBP",
      customer_id: 12345,
      payment_method: "paypal",
      payment_method_title: "PayPal",
      transaction_id: "PAYPAL-TRANS-123",
      billing: {
        first_name: "Sam",
        last_name: "Guy",
        company: "",
        email: "customer@example.com",
        phone: "07700900000",
        address_1: "123 Test Street",
        address_2: "",
        city: "London",
        state: "",
        postcode: "SW1A 1AA",
        country: "GB"
      },
      shipping: {
        first_name: "Sam",
        last_name: "Guy",
        company: "",
        address_1: "123 Test Street",
        address_2: "",
        city: "London",
        state: "",
        postcode: "SW1A 1AA",
        country: "GB"
      },
      line_items: [
        {
          id: 3,
          name: "Air Filter",
          product_id: 103,
          variation_id: 0,
          quantity: 1,
          tax_class: "",
          subtotal: "67.50",
          subtotal_tax: "13.50",
          total: "67.50",
          total_tax: "13.50",
          taxes: [],
          meta_data: [],
          sku: "AF-003",
          price: 67.50
        }
      ],
      tax_lines: [],
      shipping_lines: [],
      fee_lines: [],
      coupon_lines: [],
      refunds: [],
      meta_data: [],
      customer_note: ""
    }
  ];

  private static mockCustomer = {
    id: 12345,
    email: "customer@example.com",
    first_name: "Sam",
    last_name: "Guy",
    username: "samguy",
    date_created: "2023-06-15T08:00:00",
    date_modified: "2024-01-15T10:30:00",
    role: "customer",
    billing: {
      first_name: "Sam",
      last_name: "Guy",
      company: "",
      email: "customer@example.com",
      phone: "07700900000",
      address_1: "123 Test Street",
      address_2: "",
      city: "London",
      state: "",
      postcode: "SW1A 1AA",
      country: "GB"
    },
    shipping: {
      first_name: "Sam",
      last_name: "Guy",
      company: "",
      address_1: "123 Test Street",
      address_2: "",
      city: "London",
      state: "",
      postcode: "SW1A 1AA",
      country: "GB"
    },
    is_paying_customer: true,
    avatar_url: "",
    meta_data: []
  };

  static async getOrders(params: any): Promise<any[]> {
    console.log('[WooCommerceMock] Using mock data for orders');
    
    // Filter by search term if provided
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      return this.mockOrders.filter(order => 
        order.number.includes(searchTerm) ||
        order.billing.email.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by customer ID if provided
    if (params.customer) {
      return this.mockOrders.filter(order => 
        order.customer_id === params.customer
      );
    }
    
    // Return all orders with limit
    const limit = params.per_page || 10;
    return this.mockOrders.slice(0, limit);
  }

  static async getOrder(orderId: number): Promise<any | null> {
    console.log('[WooCommerceMock] Using mock data for order', orderId);
    return this.mockOrders.find(order => order.id === orderId) || null;
  }

  static async getCustomerByEmail(email: string): Promise<any | null> {
    console.log('[WooCommerceMock] Using mock data for customer', email);
    if (email.toLowerCase() === this.mockCustomer.email.toLowerCase()) {
      return this.mockCustomer;
    }
    return null;
  }

  static async searchCustomers(params: any): Promise<any[]> {
    console.log('[WooCommerceMock] Using mock data for customer search');
    if (params.email && params.email.toLowerCase() === this.mockCustomer.email.toLowerCase()) {
      return [this.mockCustomer];
    }
    return [];
  }

  static isUsingMockData(): boolean {
    return true;
  }
}

// Export a flag to check if mock mode is enabled
export const WOOCOMMERCE_MOCK_MODE = process.env.WOOCOMMERCE_MOCK_MODE === 'true' || 
                                      process.env.NODE_ENV === 'development';