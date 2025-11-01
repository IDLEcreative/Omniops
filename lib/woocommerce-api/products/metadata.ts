/**
 * Product Metadata API (Categories, Tags, Reviews, Shipping Classes)
 */

import type { WooCommerceClient, ListParams, ProductCategory, ProductReview } from '@/lib/woocommerce-types';
import type { ProductTag, ProductShippingClass } from '@/lib/woocommerce-full';
import { parseProductTag, parseProductShippingClass } from './parsers';

export class MetadataAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  // Categories
  async getProductCategories(params?: ListParams): Promise<ProductCategory[]> {
    const response = await this.getClient().get<ProductCategory[]>('products/categories', params);
    return response.data;
  }

  async getProductCategory(id: number): Promise<ProductCategory> {
    const response = await this.getClient().get<ProductCategory>(`products/categories/${id}`);
    return response.data;
  }

  async createProductCategory(data: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await this.getClient().post<ProductCategory>('products/categories', data);
    return response.data;
  }

  async updateProductCategory(id: number, data: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await this.getClient().put<ProductCategory>(`products/categories/${id}`, data);
    return response.data;
  }

  async deleteProductCategory(id: number, force: boolean = false): Promise<ProductCategory> {
    const response = await this.getClient().delete<ProductCategory>(`products/categories/${id}`, { force });
    return response.data;
  }

  // Tags
  async getProductTags(params?: ListParams): Promise<ProductTag[]> {
    const response = await this.getClient().get<unknown[]>('products/tags', params);
    return response.data.map((item) => parseProductTag(item));
  }

  async getProductTag(id: number): Promise<ProductTag> {
    const response = await this.getClient().get<unknown>(`products/tags/${id}`);
    return parseProductTag(response.data);
  }

  async createProductTag(data: Partial<ProductTag>): Promise<ProductTag> {
    const response = await this.getClient().post<unknown>('products/tags', data);
    return parseProductTag(response.data);
  }

  async updateProductTag(id: number, data: Partial<ProductTag>): Promise<ProductTag> {
    const response = await this.getClient().put<unknown>(`products/tags/${id}`, data);
    return parseProductTag(response.data);
  }

  async deleteProductTag(id: number, force: boolean = false): Promise<ProductTag> {
    const response = await this.getClient().delete<unknown>(`products/tags/${id}`, { force });
    return parseProductTag(response.data);
  }

  // Shipping Classes
  async getProductShippingClasses(params?: ListParams): Promise<ProductShippingClass[]> {
    const response = await this.getClient().get<unknown[]>('products/shipping_classes', params);
    return response.data.map((item) => parseProductShippingClass(item));
  }

  async getProductShippingClass(id: number): Promise<ProductShippingClass> {
    const response = await this.getClient().get<unknown>(`products/shipping_classes/${id}`);
    return parseProductShippingClass(response.data);
  }

  async createProductShippingClass(data: Partial<ProductShippingClass>): Promise<ProductShippingClass> {
    const response = await this.getClient().post<unknown>('products/shipping_classes', data);
    return parseProductShippingClass(response.data);
  }

  async updateProductShippingClass(id: number, data: Partial<ProductShippingClass>): Promise<ProductShippingClass> {
    const response = await this.getClient().put<unknown>(`products/shipping_classes/${id}`, data);
    return parseProductShippingClass(response.data);
  }

  async deleteProductShippingClass(id: number, force: boolean = false): Promise<ProductShippingClass> {
    const response = await this.getClient().delete<unknown>(`products/shipping_classes/${id}`, { force });
    return parseProductShippingClass(response.data);
  }

  // Reviews
  async getProductReviews(params?: ListParams): Promise<ProductReview[]> {
    const response = await this.getClient().get<ProductReview[]>('products/reviews', params);
    return response.data;
  }

  async getProductReview(id: number): Promise<ProductReview> {
    const response = await this.getClient().get<ProductReview>(`products/reviews/${id}`);
    return response.data;
  }

  async createProductReview(data: Partial<ProductReview>): Promise<ProductReview> {
    const response = await this.getClient().post<ProductReview>('products/reviews', data);
    return response.data;
  }

  async updateProductReview(id: number, data: Partial<ProductReview>): Promise<ProductReview> {
    const response = await this.getClient().put<ProductReview>(`products/reviews/${id}`, data);
    return response.data;
  }

  async deleteProductReview(id: number, force: boolean = false): Promise<ProductReview> {
    const response = await this.getClient().delete<ProductReview>(`products/reviews/${id}`, { force });
    return response.data;
  }
}
