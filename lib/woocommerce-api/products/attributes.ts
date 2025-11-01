/**
 * Product Attributes API
 */

import type { WooCommerceClient, ListParams, ProductAttributeTerm } from '@/lib/woocommerce-types';
import type { ProductAttribute } from '@/lib/woocommerce-full';
import { parseProductAttribute } from './parsers';

export class AttributesAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  async getProductAttributes(params?: ListParams): Promise<ProductAttribute[]> {
    const response = await this.getClient().get<unknown[]>('products/attributes', params);
    return response.data.map((item) => parseProductAttribute(item));
  }

  async getProductAttribute(id: number): Promise<ProductAttribute> {
    const response = await this.getClient().get<unknown>(`products/attributes/${id}`);
    return parseProductAttribute(response.data);
  }

  async createProductAttribute(data: Partial<ProductAttribute>): Promise<ProductAttribute> {
    const response = await this.getClient().post<unknown>('products/attributes', data);
    return parseProductAttribute(response.data);
  }

  async updateProductAttribute(id: number, data: Partial<ProductAttribute>): Promise<ProductAttribute> {
    const response = await this.getClient().put<unknown>(`products/attributes/${id}`, data);
    return parseProductAttribute(response.data);
  }

  async deleteProductAttribute(id: number, force: boolean = false): Promise<ProductAttribute> {
    const response = await this.getClient().delete<unknown>(`products/attributes/${id}`, { force });
    return parseProductAttribute(response.data);
  }

  async getAttributeTerms(attributeId: number, params?: ListParams): Promise<ProductAttributeTerm[]> {
    const response = await this.getClient().get<ProductAttributeTerm[]>(`products/attributes/${attributeId}/terms`, params);
    return response.data;
  }

  async getProductAttributeTerms(attributeId: number, params?: ListParams): Promise<ProductAttributeTerm[]> {
    return this.getAttributeTerms(attributeId, params);
  }

  async getAttributeTerm(attributeId: number, termId: number): Promise<ProductAttributeTerm> {
    const response = await this.getClient().get<ProductAttributeTerm>(`products/attributes/${attributeId}/terms/${termId}`);
    return response.data;
  }

  async createAttributeTerm(attributeId: number, data: Partial<ProductAttributeTerm>): Promise<ProductAttributeTerm> {
    const response = await this.getClient().post<ProductAttributeTerm>(`products/attributes/${attributeId}/terms`, data);
    return response.data;
  }

  async createProductAttributeTerm(attributeId: number, data: Partial<ProductAttributeTerm>): Promise<ProductAttributeTerm> {
    return this.createAttributeTerm(attributeId, data);
  }

  async updateAttributeTerm(attributeId: number, termId: number, data: Partial<ProductAttributeTerm>): Promise<ProductAttributeTerm> {
    const response = await this.getClient().put<ProductAttributeTerm>(`products/attributes/${attributeId}/terms/${termId}`, data);
    return response.data;
  }

  async updateProductAttributeTerm(attributeId: number, termId: number, data: Partial<ProductAttributeTerm>): Promise<ProductAttributeTerm> {
    return this.updateAttributeTerm(attributeId, termId, data);
  }

  async deleteAttributeTerm(attributeId: number, termId: number, force: boolean = false): Promise<ProductAttributeTerm> {
    const response = await this.getClient().delete<ProductAttributeTerm>(`products/attributes/${attributeId}/terms/${termId}`, { force });
    return response.data;
  }

  async deleteProductAttributeTerm(attributeId: number, termId: number, force: boolean = false): Promise<ProductAttributeTerm> {
    return this.deleteAttributeTerm(attributeId, termId, force);
  }
}
