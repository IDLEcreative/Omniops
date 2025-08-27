import { 
  createWooCommerceClient,
  Product, ProductVariation, ProductAttribute, ProductTag, ProductShippingClass,
  Order, OrderNote, Refund,
  Customer,
  Coupon,
  TaxRate, TaxClass,
  ShippingZone, ShippingMethod,
  PaymentGateway,
  Webhook,
  SystemStatus,
  SalesReport, TopSellersReport, CouponsReport, CustomersReport, StockReport, ReviewsReport,
  BatchOperation, BatchResponse,
  ProductSchema, ProductVariationSchema, ProductAttributeSchema, ProductTagSchema, ProductShippingClassSchema,
  OrderSchema, OrderNoteSchema, RefundSchema,
  CustomerSchema,
  CouponSchema,
  TaxRateSchema, TaxClassSchema,
  ShippingZoneSchema, ShippingMethodSchema,
  PaymentGatewaySchema,
  WebhookSchema,
  SystemStatusSchema,
  SalesReportSchema, TopSellersReportSchema, CouponsReportSchema, CustomersReportSchema, StockReportSchema, ReviewsReportSchema
} from './woocommerce-full';

export class WooCommerceAPI {
  private wc: any;

  constructor(config?: { url?: string; consumerKey?: string; consumerSecret?: string }) {
    this.wc = createWooCommerceClient(config);
  }

  // ==================== PRODUCTS ====================
  
  // Get all products with filtering
  async getProducts(params?: {
    context?: 'view' | 'edit';
    page?: number;
    per_page?: number;
    search?: string;
    after?: string;
    before?: string;
    exclude?: number[];
    include?: number[];
    offset?: number;
    order?: 'asc' | 'desc';
    orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'price' | 'popularity' | 'rating';
    parent?: number[];
    parent_exclude?: number[];
    slug?: string;
    status?: 'any' | 'draft' | 'pending' | 'private' | 'publish';
    type?: 'simple' | 'grouped' | 'external' | 'variable';
    sku?: string;
    featured?: boolean;
    category?: string;
    tag?: string;
    shipping_class?: string;
    attribute?: string;
    attribute_term?: string;
    tax_class?: string;
    on_sale?: boolean;
    min_price?: string;
    max_price?: string;
    stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  }): Promise<Product[]> {
    const response = await this.wc.get('products', params);
    return response.data.map((item: any) => ProductSchema.parse(item));
  }

  // Get single product
  async getProduct(id: number): Promise<Product> {
    const response = await this.wc.get(`products/${id}`);
    return ProductSchema.parse(response.data);
  }

  // Create product
  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await this.wc.post('products', data);
    return ProductSchema.parse(response.data);
  }

  // Update product
  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const response = await this.wc.put(`products/${id}`, data);
    return ProductSchema.parse(response.data);
  }

  // Delete product
  async deleteProduct(id: number, force: boolean = false): Promise<Product> {
    const response = await this.wc.delete(`products/${id}`, { force });
    return ProductSchema.parse(response.data);
  }

  // Batch product operations
  async batchProducts(operations: BatchOperation<Product>): Promise<BatchResponse<Product>> {
    const response = await this.wc.post('products/batch', operations);
    return {
      create: response.data.create?.map((item: any) => ProductSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => ProductSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // Product variations
  async getProductVariations(productId: number, params?: any): Promise<ProductVariation[]> {
    const response = await this.wc.get(`products/${productId}/variations`, params);
    return response.data.map((item: any) => ProductVariationSchema.parse(item));
  }

  async getProductVariation(productId: number, variationId: number): Promise<ProductVariation> {
    const response = await this.wc.get(`products/${productId}/variations/${variationId}`);
    return ProductVariationSchema.parse(response.data);
  }

  async createProductVariation(productId: number, data: Partial<ProductVariation>): Promise<ProductVariation> {
    const response = await this.wc.post(`products/${productId}/variations`, data);
    return ProductVariationSchema.parse(response.data);
  }

  async updateProductVariation(productId: number, variationId: number, data: Partial<ProductVariation>): Promise<ProductVariation> {
    const response = await this.wc.put(`products/${productId}/variations/${variationId}`, data);
    return ProductVariationSchema.parse(response.data);
  }

  async deleteProductVariation(productId: number, variationId: number, force: boolean = false): Promise<ProductVariation> {
    const response = await this.wc.delete(`products/${productId}/variations/${variationId}`, { force });
    return ProductVariationSchema.parse(response.data);
  }

  async batchProductVariations(productId: number, operations: BatchOperation<ProductVariation>): Promise<BatchResponse<ProductVariation>> {
    const response = await this.wc.post(`products/${productId}/variations/batch`, operations);
    return {
      create: response.data.create?.map((item: any) => ProductVariationSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => ProductVariationSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // Product attributes
  async getProductAttributes(params?: any): Promise<ProductAttribute[]> {
    const response = await this.wc.get('products/attributes', params);
    return response.data.map((item: any) => ProductAttributeSchema.parse(item));
  }

  async getProductAttribute(id: number): Promise<ProductAttribute> {
    const response = await this.wc.get(`products/attributes/${id}`);
    return ProductAttributeSchema.parse(response.data);
  }

  async createProductAttribute(data: Partial<ProductAttribute>): Promise<ProductAttribute> {
    const response = await this.wc.post('products/attributes', data);
    return ProductAttributeSchema.parse(response.data);
  }

  async updateProductAttribute(id: number, data: Partial<ProductAttribute>): Promise<ProductAttribute> {
    const response = await this.wc.put(`products/attributes/${id}`, data);
    return ProductAttributeSchema.parse(response.data);
  }

  async deleteProductAttribute(id: number, force: boolean = false): Promise<ProductAttribute> {
    const response = await this.wc.delete(`products/attributes/${id}`, { force });
    return ProductAttributeSchema.parse(response.data);
  }

  // Product attribute terms
  async getProductAttributeTerms(attributeId: number, params?: any): Promise<any[]> {
    const response = await this.wc.get(`products/attributes/${attributeId}/terms`, params);
    return response.data;
  }

  async getProductAttributeTerm(attributeId: number, termId: number): Promise<any> {
    const response = await this.wc.get(`products/attributes/${attributeId}/terms/${termId}`);
    return response.data;
  }

  async createProductAttributeTerm(attributeId: number, data: any): Promise<any> {
    const response = await this.wc.post(`products/attributes/${attributeId}/terms`, data);
    return response.data;
  }

  async updateProductAttributeTerm(attributeId: number, termId: number, data: any): Promise<any> {
    const response = await this.wc.put(`products/attributes/${attributeId}/terms/${termId}`, data);
    return response.data;
  }

  async deleteProductAttributeTerm(attributeId: number, termId: number, force: boolean = false): Promise<any> {
    const response = await this.wc.delete(`products/attributes/${attributeId}/terms/${termId}`, { force });
    return response.data;
  }

  // Product categories
  async getProductCategories(params?: any): Promise<any[]> {
    const response = await this.wc.get('products/categories', params);
    return response.data;
  }

  async getProductCategory(id: number): Promise<any> {
    const response = await this.wc.get(`products/categories/${id}`);
    return response.data;
  }

  async createProductCategory(data: any): Promise<any> {
    const response = await this.wc.post('products/categories', data);
    return response.data;
  }

  async updateProductCategory(id: number, data: any): Promise<any> {
    const response = await this.wc.put(`products/categories/${id}`, data);
    return response.data;
  }

  async deleteProductCategory(id: number, force: boolean = false): Promise<any> {
    const response = await this.wc.delete(`products/categories/${id}`, { force });
    return response.data;
  }

  // Product tags
  async getProductTags(params?: any): Promise<ProductTag[]> {
    const response = await this.wc.get('products/tags', params);
    return response.data.map((item: any) => ProductTagSchema.parse(item));
  }

  async getProductTag(id: number): Promise<ProductTag> {
    const response = await this.wc.get(`products/tags/${id}`);
    return ProductTagSchema.parse(response.data);
  }

  async createProductTag(data: Partial<ProductTag>): Promise<ProductTag> {
    const response = await this.wc.post('products/tags', data);
    return ProductTagSchema.parse(response.data);
  }

  async updateProductTag(id: number, data: Partial<ProductTag>): Promise<ProductTag> {
    const response = await this.wc.put(`products/tags/${id}`, data);
    return ProductTagSchema.parse(response.data);
  }

  async deleteProductTag(id: number, force: boolean = false): Promise<ProductTag> {
    const response = await this.wc.delete(`products/tags/${id}`, { force });
    return ProductTagSchema.parse(response.data);
  }

  // Product reviews
  async getProductReviews(params?: any): Promise<any[]> {
    const response = await this.wc.get('products/reviews', params);
    return response.data;
  }

  async getProductReview(id: number): Promise<any> {
    const response = await this.wc.get(`products/reviews/${id}`);
    return response.data;
  }

  async createProductReview(data: any): Promise<any> {
    const response = await this.wc.post('products/reviews', data);
    return response.data;
  }

  async updateProductReview(id: number, data: any): Promise<any> {
    const response = await this.wc.put(`products/reviews/${id}`, data);
    return response.data;
  }

  async deleteProductReview(id: number, force: boolean = false): Promise<any> {
    const response = await this.wc.delete(`products/reviews/${id}`, { force });
    return response.data;
  }

  // Product shipping classes
  async getProductShippingClasses(params?: any): Promise<ProductShippingClass[]> {
    const response = await this.wc.get('products/shipping_classes', params);
    return response.data.map((item: any) => ProductShippingClassSchema.parse(item));
  }

  async getProductShippingClass(id: number): Promise<ProductShippingClass> {
    const response = await this.wc.get(`products/shipping_classes/${id}`);
    return ProductShippingClassSchema.parse(response.data);
  }

  async createProductShippingClass(data: Partial<ProductShippingClass>): Promise<ProductShippingClass> {
    const response = await this.wc.post('products/shipping_classes', data);
    return ProductShippingClassSchema.parse(response.data);
  }

  async updateProductShippingClass(id: number, data: Partial<ProductShippingClass>): Promise<ProductShippingClass> {
    const response = await this.wc.put(`products/shipping_classes/${id}`, data);
    return ProductShippingClassSchema.parse(response.data);
  }

  async deleteProductShippingClass(id: number, force: boolean = false): Promise<ProductShippingClass> {
    const response = await this.wc.delete(`products/shipping_classes/${id}`, { force });
    return ProductShippingClassSchema.parse(response.data);
  }

  // ==================== ORDERS ====================
  
  // Get all orders
  async getOrders(params?: {
    context?: 'view' | 'edit';
    page?: number;
    per_page?: number;
    search?: string;
    after?: string;
    before?: string;
    exclude?: number[];
    include?: number[];
    offset?: number;
    order?: 'asc' | 'desc';
    orderby?: 'date' | 'id' | 'include' | 'title' | 'slug';
    parent?: number[];
    parent_exclude?: number[];
    status?: string[];
    customer?: number;
    product?: number;
    dp?: number;
  }): Promise<Order[]> {
    const response = await this.wc.get('orders', params);
    return response.data.map((item: any) => OrderSchema.parse(item));
  }

  // Get single order
  async getOrder(id: number): Promise<Order> {
    const response = await this.wc.get(`orders/${id}`);
    return OrderSchema.parse(response.data);
  }

  // Create order
  async createOrder(data: Partial<Order>): Promise<Order> {
    const response = await this.wc.post('orders', data);
    return OrderSchema.parse(response.data);
  }

  // Update order
  async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    const response = await this.wc.put(`orders/${id}`, data);
    return OrderSchema.parse(response.data);
  }

  // Delete order
  async deleteOrder(id: number, force: boolean = false): Promise<Order> {
    const response = await this.wc.delete(`orders/${id}`, { force });
    return OrderSchema.parse(response.data);
  }

  // Batch order operations
  async batchOrders(operations: BatchOperation<Order>): Promise<BatchResponse<Order>> {
    const response = await this.wc.post('orders/batch', operations);
    return {
      create: response.data.create?.map((item: any) => OrderSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => OrderSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // Order notes
  async getOrderNotes(orderId: number, params?: any): Promise<OrderNote[]> {
    const response = await this.wc.get(`orders/${orderId}/notes`, params);
    return response.data.map((item: any) => OrderNoteSchema.parse(item));
  }

  async getOrderNote(orderId: number, noteId: number): Promise<OrderNote> {
    const response = await this.wc.get(`orders/${orderId}/notes/${noteId}`);
    return OrderNoteSchema.parse(response.data);
  }

  async createOrderNote(orderId: number, data: { note: string; customer_note?: boolean }): Promise<OrderNote> {
    const response = await this.wc.post(`orders/${orderId}/notes`, data);
    return OrderNoteSchema.parse(response.data);
  }

  async deleteOrderNote(orderId: number, noteId: number, force: boolean = false): Promise<OrderNote> {
    const response = await this.wc.delete(`orders/${orderId}/notes/${noteId}`, { force });
    return OrderNoteSchema.parse(response.data);
  }

  // Order refunds
  async getOrderRefunds(orderId: number, params?: any): Promise<Refund[]> {
    const response = await this.wc.get(`orders/${orderId}/refunds`, params);
    return response.data.map((item: any) => RefundSchema.parse(item));
  }

  async getOrderRefund(orderId: number, refundId: number): Promise<Refund> {
    const response = await this.wc.get(`orders/${orderId}/refunds/${refundId}`);
    return RefundSchema.parse(response.data);
  }

  async createOrderRefund(orderId: number, data: Partial<Refund>): Promise<Refund> {
    const response = await this.wc.post(`orders/${orderId}/refunds`, data);
    return RefundSchema.parse(response.data);
  }

  async deleteOrderRefund(orderId: number, refundId: number, force: boolean = false): Promise<Refund> {
    const response = await this.wc.delete(`orders/${orderId}/refunds/${refundId}`, { force });
    return RefundSchema.parse(response.data);
  }

  // New standalone refunds endpoint (WooCommerce 9.0+)
  async getRefunds(params?: any): Promise<Refund[]> {
    const response = await this.wc.get('refunds', params);
    return response.data.map((item: any) => RefundSchema.parse(item));
  }

  async getRefund(id: number): Promise<Refund> {
    const response = await this.wc.get(`refunds/${id}`);
    return RefundSchema.parse(response.data);
  }

  // ==================== CUSTOMERS ====================
  
  // Get all customers
  async getCustomers(params?: {
    context?: 'view' | 'edit';
    page?: number;
    per_page?: number;
    search?: string;
    exclude?: number[];
    include?: number[];
    offset?: number;
    order?: 'asc' | 'desc';
    orderby?: 'id' | 'include' | 'name' | 'registered_date';
    email?: string;
    role?: string;
  }): Promise<Customer[]> {
    const response = await this.wc.get('customers', params);
    return response.data.map((item: any) => CustomerSchema.parse(item));
  }

  // Get single customer
  async getCustomer(id: number): Promise<Customer> {
    const response = await this.wc.get(`customers/${id}`);
    return CustomerSchema.parse(response.data);
  }

  // Get customer by email
  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const customers = await this.getCustomers({ email, per_page: 1 });
    return customers.length > 0 ? (customers[0] || null) : null;
  }

  // Create customer
  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await this.wc.post('customers', data);
    return CustomerSchema.parse(response.data);
  }

  // Update customer
  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const response = await this.wc.put(`customers/${id}`, data);
    return CustomerSchema.parse(response.data);
  }

  // Delete customer
  async deleteCustomer(id: number, force: boolean = false): Promise<Customer> {
    const response = await this.wc.delete(`customers/${id}`, { force });
    return CustomerSchema.parse(response.data);
  }

  // Batch customer operations
  async batchCustomers(operations: BatchOperation<Customer>): Promise<BatchResponse<Customer>> {
    const response = await this.wc.post('customers/batch', operations);
    return {
      create: response.data.create?.map((item: any) => CustomerSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => CustomerSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // Get customer downloads
  async getCustomerDownloads(customerId: number): Promise<any[]> {
    const response = await this.wc.get(`customers/${customerId}/downloads`);
    return response.data;
  }

  // ==================== COUPONS ====================
  
  // Get all coupons
  async getCoupons(params?: {
    context?: 'view' | 'edit';
    page?: number;
    per_page?: number;
    search?: string;
    after?: string;
    before?: string;
    exclude?: number[];
    include?: number[];
    offset?: number;
    order?: 'asc' | 'desc';
    orderby?: 'date' | 'id' | 'include' | 'title' | 'slug';
    code?: string;
  }): Promise<Coupon[]> {
    const response = await this.wc.get('coupons', params);
    return response.data.map((item: any) => CouponSchema.parse(item));
  }

  // Get single coupon
  async getCoupon(id: number): Promise<Coupon> {
    const response = await this.wc.get(`coupons/${id}`);
    return CouponSchema.parse(response.data);
  }

  // Get coupon by code
  async getCouponByCode(code: string): Promise<Coupon | null> {
    const coupons = await this.getCoupons({ code, per_page: 1 });
    return coupons.length > 0 ? (coupons[0] || null) : null;
  }

  // Create coupon
  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const response = await this.wc.post('coupons', data);
    return CouponSchema.parse(response.data);
  }

  // Update coupon
  async updateCoupon(id: number, data: Partial<Coupon>): Promise<Coupon> {
    const response = await this.wc.put(`coupons/${id}`, data);
    return CouponSchema.parse(response.data);
  }

  // Delete coupon
  async deleteCoupon(id: number, force: boolean = false): Promise<Coupon> {
    const response = await this.wc.delete(`coupons/${id}`, { force });
    return CouponSchema.parse(response.data);
  }

  // Batch coupon operations
  async batchCoupons(operations: BatchOperation<Coupon>): Promise<BatchResponse<Coupon>> {
    const response = await this.wc.post('coupons/batch', operations);
    return {
      create: response.data.create?.map((item: any) => CouponSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => CouponSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // ==================== REPORTS ====================
  
  // Get sales report
  async getSalesReport(params?: {
    context?: 'view';
    period?: 'week' | 'month' | 'last_month' | 'year';
    date_min?: string;
    date_max?: string;
  }): Promise<SalesReport> {
    const response = await this.wc.get('reports/sales', params);
    return SalesReportSchema.parse(response.data[0]);
  }

  // Get top sellers report
  async getTopSellersReport(params?: {
    context?: 'view';
    period?: 'week' | 'month' | 'last_month' | 'year';
    date_min?: string;
    date_max?: string;
  }): Promise<TopSellersReport[]> {
    const response = await this.wc.get('reports/top_sellers', params);
    return response.data.map((item: any) => TopSellersReportSchema.parse(item));
  }

  // Get coupons report
  async getCouponsReport(params?: any): Promise<CouponsReport[]> {
    const response = await this.wc.get('reports/coupons/totals', params);
    return response.data.map((item: any) => CouponsReportSchema.parse(item));
  }

  // Get customers report
  async getCustomersReport(params?: any): Promise<CustomersReport[]> {
    const response = await this.wc.get('reports/customers/totals', params);
    return response.data.map((item: any) => CustomersReportSchema.parse(item));
  }

  // Get orders report
  async getOrdersReport(params?: any): Promise<any> {
    const response = await this.wc.get('reports/orders/totals', params);
    return response.data;
  }

  // Get products report
  async getProductsReport(params?: any): Promise<any> {
    const response = await this.wc.get('reports/products/totals', params);
    return response.data;
  }

  // Get reviews report
  async getReviewsReport(params?: any): Promise<ReviewsReport[]> {
    const response = await this.wc.get('reports/reviews/totals', params);
    return response.data.map((item: any) => ReviewsReportSchema.parse(item));
  }

  // ==================== TAXES ====================
  
  // Get tax rates
  async getTaxRates(params?: any): Promise<TaxRate[]> {
    const response = await this.wc.get('taxes', params);
    return response.data.map((item: any) => TaxRateSchema.parse(item));
  }

  // Get single tax rate
  async getTaxRate(id: number): Promise<TaxRate> {
    const response = await this.wc.get(`taxes/${id}`);
    return TaxRateSchema.parse(response.data);
  }

  // Create tax rate
  async createTaxRate(data: Partial<TaxRate>): Promise<TaxRate> {
    const response = await this.wc.post('taxes', data);
    return TaxRateSchema.parse(response.data);
  }

  // Update tax rate
  async updateTaxRate(id: number, data: Partial<TaxRate>): Promise<TaxRate> {
    const response = await this.wc.put(`taxes/${id}`, data);
    return TaxRateSchema.parse(response.data);
  }

  // Delete tax rate
  async deleteTaxRate(id: number, force: boolean = false): Promise<TaxRate> {
    const response = await this.wc.delete(`taxes/${id}`, { force });
    return TaxRateSchema.parse(response.data);
  }

  // Get tax classes
  async getTaxClasses(): Promise<TaxClass[]> {
    const response = await this.wc.get('taxes/classes');
    return response.data.map((item: any) => TaxClassSchema.parse(item));
  }

  // Create tax class
  async createTaxClass(data: Partial<TaxClass>): Promise<TaxClass> {
    const response = await this.wc.post('taxes/classes', data);
    return TaxClassSchema.parse(response.data);
  }

  // Delete tax class
  async deleteTaxClass(slug: string, force: boolean = false): Promise<TaxClass> {
    const response = await this.wc.delete(`taxes/classes/${slug}`, { force });
    return TaxClassSchema.parse(response.data);
  }

  // ==================== SHIPPING ====================
  
  // Get shipping zones
  async getShippingZones(): Promise<ShippingZone[]> {
    const response = await this.wc.get('shipping/zones');
    return response.data.map((item: any) => ShippingZoneSchema.parse(item));
  }

  // Get single shipping zone
  async getShippingZone(id: number): Promise<ShippingZone> {
    const response = await this.wc.get(`shipping/zones/${id}`);
    return ShippingZoneSchema.parse(response.data);
  }

  // Create shipping zone
  async createShippingZone(data: Partial<ShippingZone>): Promise<ShippingZone> {
    const response = await this.wc.post('shipping/zones', data);
    return ShippingZoneSchema.parse(response.data);
  }

  // Update shipping zone
  async updateShippingZone(id: number, data: Partial<ShippingZone>): Promise<ShippingZone> {
    const response = await this.wc.put(`shipping/zones/${id}`, data);
    return ShippingZoneSchema.parse(response.data);
  }

  // Delete shipping zone
  async deleteShippingZone(id: number, force: boolean = false): Promise<ShippingZone> {
    const response = await this.wc.delete(`shipping/zones/${id}`, { force });
    return ShippingZoneSchema.parse(response.data);
  }

  // Get shipping zone locations
  async getShippingZoneLocations(zoneId: number): Promise<any[]> {
    const response = await this.wc.get(`shipping/zones/${zoneId}/locations`);
    return response.data;
  }

  // Update shipping zone locations
  async updateShippingZoneLocations(zoneId: number, locations: any[]): Promise<any[]> {
    const response = await this.wc.put(`shipping/zones/${zoneId}/locations`, locations);
    return response.data;
  }

  // Get shipping zone methods
  async getShippingZoneMethods(zoneId: number): Promise<any[]> {
    const response = await this.wc.get(`shipping/zones/${zoneId}/methods`);
    return response.data;
  }

  // Get single shipping zone method
  async getShippingZoneMethod(zoneId: number, instanceId: number): Promise<any> {
    const response = await this.wc.get(`shipping/zones/${zoneId}/methods/${instanceId}`);
    return response.data;
  }

  // Create shipping zone method
  async createShippingZoneMethod(zoneId: number, data: any): Promise<any> {
    const response = await this.wc.post(`shipping/zones/${zoneId}/methods`, data);
    return response.data;
  }

  // Update shipping zone method
  async updateShippingZoneMethod(zoneId: number, instanceId: number, data: any): Promise<any> {
    const response = await this.wc.put(`shipping/zones/${zoneId}/methods/${instanceId}`, data);
    return response.data;
  }

  // Delete shipping zone method
  async deleteShippingZoneMethod(zoneId: number, instanceId: number, force: boolean = false): Promise<any> {
    const response = await this.wc.delete(`shipping/zones/${zoneId}/methods/${instanceId}`, { force });
    return response.data;
  }

  // Get all shipping methods
  async getShippingMethods(): Promise<ShippingMethod[]> {
    const response = await this.wc.get('shipping_methods');
    return response.data.map((item: any) => ShippingMethodSchema.parse(item));
  }

  // Get single shipping method
  async getShippingMethod(id: string): Promise<ShippingMethod> {
    const response = await this.wc.get(`shipping_methods/${id}`);
    return ShippingMethodSchema.parse(response.data);
  }

  // ==================== PAYMENT GATEWAYS ====================
  
  // Get payment gateways
  async getPaymentGateways(): Promise<PaymentGateway[]> {
    const response = await this.wc.get('payment_gateways');
    return response.data.map((item: any) => PaymentGatewaySchema.parse(item));
  }

  // Get single payment gateway
  async getPaymentGateway(id: string): Promise<PaymentGateway> {
    const response = await this.wc.get(`payment_gateways/${id}`);
    return PaymentGatewaySchema.parse(response.data);
  }

  // Update payment gateway
  async updatePaymentGateway(id: string, data: Partial<PaymentGateway>): Promise<PaymentGateway> {
    const response = await this.wc.put(`payment_gateways/${id}`, data);
    return PaymentGatewaySchema.parse(response.data);
  }

  // ==================== SETTINGS ====================
  
  // Get all settings groups
  async getSettingsGroups(): Promise<any[]> {
    const response = await this.wc.get('settings');
    return response.data;
  }

  // Get settings options for a group
  async getSettingsOptions(groupId: string): Promise<any[]> {
    const response = await this.wc.get(`settings/${groupId}`);
    return response.data;
  }

  // Get single setting option
  async getSettingOption(groupId: string, optionId: string): Promise<any> {
    const response = await this.wc.get(`settings/${groupId}/${optionId}`);
    return response.data;
  }

  // Update setting option
  async updateSettingOption(groupId: string, optionId: string, value: any): Promise<any> {
    const response = await this.wc.put(`settings/${groupId}/${optionId}`, { value });
    return response.data;
  }

  // Batch update settings
  async batchUpdateSettings(groupId: string, updates: Array<{ id: string; value: any }>): Promise<any> {
    const response = await this.wc.post(`settings/${groupId}/batch`, { update: updates });
    return response.data;
  }

  // ==================== SYSTEM STATUS ====================
  
  // Get system status
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await this.wc.get('system_status');
    return SystemStatusSchema.parse(response.data);
  }

  // Get system status tools
  async getSystemStatusTools(): Promise<any[]> {
    const response = await this.wc.get('system_status/tools');
    return response.data;
  }

  // Get single system status tool
  async getSystemStatusTool(id: string): Promise<any> {
    const response = await this.wc.get(`system_status/tools/${id}`);
    return response.data;
  }

  // Run system status tool
  async runSystemStatusTool(id: string): Promise<any> {
    const response = await this.wc.put(`system_status/tools/${id}`, { action: 'run' });
    return response.data;
  }

  // ==================== WEBHOOKS ====================
  
  // Get all webhooks
  async getWebhooks(params?: {
    context?: 'view' | 'edit';
    page?: number;
    per_page?: number;
    search?: string;
    after?: string;
    before?: string;
    exclude?: number[];
    include?: number[];
    offset?: number;
    order?: 'asc' | 'desc';
    orderby?: 'date' | 'id' | 'title';
    status?: 'all' | 'active' | 'paused' | 'disabled';
  }): Promise<Webhook[]> {
    const response = await this.wc.get('webhooks', params);
    return response.data.map((item: any) => WebhookSchema.parse(item));
  }

  // Get single webhook
  async getWebhook(id: number): Promise<Webhook> {
    const response = await this.wc.get(`webhooks/${id}`);
    return WebhookSchema.parse(response.data);
  }

  // Create webhook
  async createWebhook(data: Partial<Webhook>): Promise<Webhook> {
    const response = await this.wc.post('webhooks', data);
    return WebhookSchema.parse(response.data);
  }

  // Update webhook
  async updateWebhook(id: number, data: Partial<Webhook>): Promise<Webhook> {
    const response = await this.wc.put(`webhooks/${id}`, data);
    return WebhookSchema.parse(response.data);
  }

  // Delete webhook
  async deleteWebhook(id: number, force: boolean = false): Promise<Webhook> {
    const response = await this.wc.delete(`webhooks/${id}`, { force });
    return WebhookSchema.parse(response.data);
  }

  // Batch webhook operations
  async batchWebhooks(operations: BatchOperation<Webhook>): Promise<BatchResponse<Webhook>> {
    const response = await this.wc.post('webhooks/batch', operations);
    return {
      create: response.data.create?.map((item: any) => WebhookSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => WebhookSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // ==================== DATA ====================
  
  // Generic get method for direct API access
  async get(path: string, params?: any): Promise<any> {
    const response = await this.wc.get(path, params);
    return response.data;
  }
  
  // Get countries
  async getCountries(): Promise<any[]> {
    const response = await this.wc.get('data/countries');
    return response.data;
  }

  // Get currencies
  async getCurrencies(): Promise<any[]> {
    const response = await this.wc.get('data/currencies');
    return response.data;
  }

  // Get current currency
  async getCurrentCurrency(): Promise<any> {
    const response = await this.wc.get('data/currencies/current');
    return response.data;
  }

  // Get continents
  async getContinents(): Promise<any[]> {
    const response = await this.wc.get('data/continents');
    return response.data;
  }
}

// Export a singleton instance for convenience
export const wooCommerceAPI = new WooCommerceAPI();