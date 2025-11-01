/**
 * Core Product Operations
 */

import type { WooCommerceClient, ProductListParams, ListParams } from '@/lib/woocommerce-types';
import type { Product, BatchOperation, BatchResponse } from '@/lib/woocommerce-full';
import { parseProduct } from './parsers';

export class CoreProductsAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  async getProducts(params?: ProductListParams): Promise<Product[]> {
    const wc = this.getClient();
    const response = await wc.get<unknown[]>('products', params);
    return response.data.map((item) => parseProduct(item));
  }

  async getProduct(id: number): Promise<Product> {
    const response = await this.getClient().get<unknown>(`products/${id}`);
    return parseProduct(response.data);
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await this.getClient().post<unknown>('products', data);
    return parseProduct(response.data);
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const response = await this.getClient().put<unknown>(`products/${id}`, data);
    return parseProduct(response.data);
  }

  async deleteProduct(id: number, force: boolean = false): Promise<Product> {
    const response = await this.getClient().delete<unknown>(`products/${id}`, { force });
    return parseProduct(response.data);
  }

  async batchProducts(operations: BatchOperation<Product>): Promise<BatchResponse<Product>> {
    const response = await this.getClient().post<any>('products/batch', operations);
    return {
      create: response.data.create?.map((item: any) => parseProduct(item)) || [],
      update: response.data.update?.map((item: any) => parseProduct(item)) || [],
      delete: response.data.delete || []
    };
  }
}
