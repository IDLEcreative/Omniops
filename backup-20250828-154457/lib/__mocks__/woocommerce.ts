// Mock for lib/woocommerce

export const createWooCommerceClient = jest.fn();
export const getProducts = jest.fn();
export const getProduct = jest.fn();
export const getOrders = jest.fn();
export const getOrder = jest.fn();
export const getCustomerByEmail = jest.fn();
export const getCategories = jest.fn();
export const getProductStock = jest.fn();
export const searchProducts = jest.fn();

export const ProductSchema = { parse: (data: any) => data };
export const OrderSchema = { parse: (data: any) => data };
export const CustomerSchema = { parse: (data: any) => data };