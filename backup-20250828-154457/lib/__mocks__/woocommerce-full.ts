// Mock for lib/woocommerce-full

export const createWooCommerceClient = jest.fn();

export const ProductSchema = { parse: (data: any) => data };
export const OrderSchema = { parse: (data: any) => data };
export const CustomerSchema = { parse: (data: any) => data };
export const CouponSchema = { parse: (data: any) => data };
export const SalesReportSchema = { parse: (data: any) => data };
export const TopSellersReportSchema = { parse: (data: any) => data };
export const SystemStatusSchema = { parse: (data: any) => data };

export const getProducts = jest.fn();
export const getProduct = jest.fn();
export const createProduct = jest.fn();
export const updateProduct = jest.fn();
export const deleteProduct = jest.fn();
export const getOrders = jest.fn();
export const getOrder = jest.fn();
export const createOrder = jest.fn();
export const updateOrder = jest.fn();
export const getCustomers = jest.fn();
export const getCustomer = jest.fn();
export const createCustomer = jest.fn();
export const updateCustomer = jest.fn();
export const getCoupons = jest.fn();
export const getCoupon = jest.fn();
export const createCoupon = jest.fn();
export const updateCoupon = jest.fn();
export const deleteCoupon = jest.fn();
export const getSalesReport = jest.fn();
export const getTopSellers = jest.fn();
export const getSystemStatus = jest.fn();