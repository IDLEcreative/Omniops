/**
 * Product Variations API
 */

import type { WooCommerceClient, ListParams } from '@/lib/woocommerce-types';
import type { ProductVariation, BatchOperation, BatchResponse } from '@/lib/woocommerce-full';
import { parseProductVariation } from './parsers';

export class VariationsAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  async getProductVariations(productId: number, params?: ListParams): Promise<ProductVariation[]> {
    const response = await this.getClient().get<unknown[]>(`products/${productId}/variations`, params);
    return response.data.map((item) => parseProductVariation(item));
  }

  async getProductVariation(productId: number, variationId: number): Promise<ProductVariation> {
    const response = await this.getClient().get<unknown>(`products/${productId}/variations/${variationId}`);
    return parseProductVariation(response.data);
  }

  async createProductVariation(productId: number, data: Partial<ProductVariation>): Promise<ProductVariation> {
    const response = await this.getClient().post<unknown>(`products/${productId}/variations`, data);
    return parseProductVariation(response.data);
  }

  async updateProductVariation(productId: number, variationId: number, data: Partial<ProductVariation>): Promise<ProductVariation> {
    const response = await this.getClient().put<unknown>(`products/${productId}/variations/${variationId}`, data);
    return parseProductVariation(response.data);
  }

  async deleteProductVariation(productId: number, variationId: number, force: boolean = false): Promise<ProductVariation> {
    const response = await this.getClient().delete<unknown>(`products/${productId}/variations/${variationId}`, { force });
    return parseProductVariation(response.data);
  }

  async batchProductVariations(productId: number, operations: BatchOperation<ProductVariation>): Promise<BatchResponse<ProductVariation>> {
    const response = await this.getClient().post<any>(`products/${productId}/variations/batch`, operations);
    return {
      create: response.data.create?.map((item: any) => parseProductVariation(item)) || [],
      update: response.data.update?.map((item: any) => parseProductVariation(item)) || [],
      delete: response.data.delete || []
    };
  }
}
