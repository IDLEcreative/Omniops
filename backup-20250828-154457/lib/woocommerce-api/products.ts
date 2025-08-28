import {
  Product,
  ProductVariation,
  ProductAttribute,
  ProductTag,
  ProductShippingClass,
  ProductSchema,
  ProductVariationSchema,
  ProductAttributeSchema,
  ProductTagSchema,
  ProductShippingClassSchema,
  BatchOperation,
  BatchResponse
} from '../woocommerce-full';

import {
  ProductAttributeTerm,
  ProductCategory,
  ProductReview,
  WooCommerceClient,
  ProductListParams,
  ListParams
} from '../woocommerce-types';

export class ProductsAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  // Get all products with filtering
  async getProducts(params?: ProductListParams): Promise<Product[]> {
    const wc = this.getClient();
    const response = await wc.get<unknown[]>('products', params);
    return response.data.map((item) => ProductSchema.parse(item));
  }

  // Get single product
  async getProduct(id: number): Promise<Product> {
    const response = await this.getClient().get<unknown>(`products/${id}`);
    return ProductSchema.parse(response.data);
  }

  // Create product
  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await this.getClient().post<unknown>('products', data);
    return ProductSchema.parse(response.data);
  }

  // Update product
  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const response = await this.getClient().put<unknown>(`products/${id}`, data);
    return ProductSchema.parse(response.data);
  }

  // Delete product
  async deleteProduct(id: number, force: boolean = false): Promise<Product> {
    const response = await this.getClient().delete<unknown>(`products/${id}`, { force });
    return ProductSchema.parse(response.data);
  }

  // Batch product operations
  async batchProducts(operations: BatchOperation<Product>): Promise<BatchResponse<Product>> {
    const response = await this.getClient().post<any>('products/batch', operations);
    return {
      create: response.data.create?.map((item: any) => ProductSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => ProductSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // Get product variations
  async getProductVariations(productId: number, params?: ListParams): Promise<ProductVariation[]> {
    const response = await this.getClient().get<unknown[]>(`products/${productId}/variations`, params);
    return response.data.map((item) => ProductVariationSchema.parse(item));
  }

  // Get single product variation
  async getProductVariation(productId: number, variationId: number): Promise<ProductVariation> {
    const response = await this.getClient().get<unknown>(`products/${productId}/variations/${variationId}`);
    return ProductVariationSchema.parse(response.data);
  }

  // Create product variation
  async createProductVariation(productId: number, data: Partial<ProductVariation>): Promise<ProductVariation> {
    const response = await this.getClient().post<unknown>(`products/${productId}/variations`, data);
    return ProductVariationSchema.parse(response.data);
  }

  // Update product variation
  async updateProductVariation(productId: number, variationId: number, data: Partial<ProductVariation>): Promise<ProductVariation> {
    const response = await this.getClient().put<unknown>(`products/${productId}/variations/${variationId}`, data);
    return ProductVariationSchema.parse(response.data);
  }

  // Delete product variation
  async deleteProductVariation(productId: number, variationId: number, force: boolean = false): Promise<ProductVariation> {
    const response = await this.getClient().delete<unknown>(`products/${productId}/variations/${variationId}`, { force });
    return ProductVariationSchema.parse(response.data);
  }

  // Batch variation operations
  async batchProductVariations(productId: number, operations: BatchOperation<ProductVariation>): Promise<BatchResponse<ProductVariation>> {
    const response = await this.getClient().post<any>(`products/${productId}/variations/batch`, operations);
    return {
      create: response.data.create?.map((item: any) => ProductVariationSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => ProductVariationSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // Get product attributes
  async getProductAttributes(params?: ListParams): Promise<ProductAttribute[]> {
    const response = await this.getClient().get<unknown[]>('products/attributes', params);
    return response.data.map((item) => ProductAttributeSchema.parse(item));
  }

  // Get single product attribute
  async getProductAttribute(id: number): Promise<ProductAttribute> {
    const response = await this.getClient().get<unknown>(`products/attributes/${id}`);
    return ProductAttributeSchema.parse(response.data);
  }

  // Create product attribute
  async createProductAttribute(data: Partial<ProductAttribute>): Promise<ProductAttribute> {
    const response = await this.getClient().post<unknown>('products/attributes', data);
    return ProductAttributeSchema.parse(response.data);
  }

  // Update product attribute
  async updateProductAttribute(id: number, data: Partial<ProductAttribute>): Promise<ProductAttribute> {
    const response = await this.getClient().put<unknown>(`products/attributes/${id}`, data);
    return ProductAttributeSchema.parse(response.data);
  }

  // Delete product attribute
  async deleteProductAttribute(id: number, force: boolean = false): Promise<ProductAttribute> {
    const response = await this.getClient().delete<unknown>(`products/attributes/${id}`, { force });
    return ProductAttributeSchema.parse(response.data);
  }

  // Get attribute terms
  async getAttributeTerms(attributeId: number, params?: ListParams): Promise<ProductAttributeTerm[]> {
    const response = await this.getClient().get<ProductAttributeTerm[]>(`products/attributes/${attributeId}/terms`, params);
    return response.data;
  }

  // Alias for backwards compatibility
  async getProductAttributeTerms(attributeId: number, params?: ListParams): Promise<ProductAttributeTerm[]> {
    return this.getAttributeTerms(attributeId, params);
  }

  // Get single attribute term
  async getAttributeTerm(attributeId: number, termId: number): Promise<ProductAttributeTerm> {
    const response = await this.getClient().get<ProductAttributeTerm>(`products/attributes/${attributeId}/terms/${termId}`);
    return response.data;
  }

  // Create attribute term
  async createAttributeTerm(attributeId: number, data: Partial<ProductAttributeTerm>): Promise<ProductAttributeTerm> {
    const response = await this.getClient().post<ProductAttributeTerm>(`products/attributes/${attributeId}/terms`, data);
    return response.data;
  }

  // Alias for backwards compatibility
  async createProductAttributeTerm(attributeId: number, data: Partial<ProductAttributeTerm>): Promise<ProductAttributeTerm> {
    return this.createAttributeTerm(attributeId, data);
  }

  // Update attribute term
  async updateAttributeTerm(attributeId: number, termId: number, data: Partial<ProductAttributeTerm>): Promise<ProductAttributeTerm> {
    const response = await this.getClient().put<ProductAttributeTerm>(`products/attributes/${attributeId}/terms/${termId}`, data);
    return response.data;
  }

  // Alias for backwards compatibility
  async updateProductAttributeTerm(attributeId: number, termId: number, data: Partial<ProductAttributeTerm>): Promise<ProductAttributeTerm> {
    return this.updateAttributeTerm(attributeId, termId, data);
  }

  // Delete attribute term
  async deleteAttributeTerm(attributeId: number, termId: number, force: boolean = false): Promise<ProductAttributeTerm> {
    const response = await this.getClient().delete<ProductAttributeTerm>(`products/attributes/${attributeId}/terms/${termId}`, { force });
    return response.data;
  }

  // Alias for backwards compatibility
  async deleteProductAttributeTerm(attributeId: number, termId: number, force: boolean = false): Promise<ProductAttributeTerm> {
    return this.deleteAttributeTerm(attributeId, termId, force);
  }

  // Get product categories
  async getProductCategories(params?: ListParams): Promise<ProductCategory[]> {
    const response = await this.getClient().get<ProductCategory[]>('products/categories', params);
    return response.data;
  }

  // Get single product category
  async getProductCategory(id: number): Promise<ProductCategory> {
    const response = await this.getClient().get<ProductCategory>(`products/categories/${id}`);
    return response.data;
  }

  // Create product category
  async createProductCategory(data: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await this.getClient().post<ProductCategory>('products/categories', data);
    return response.data;
  }

  // Update product category
  async updateProductCategory(id: number, data: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await this.getClient().put<ProductCategory>(`products/categories/${id}`, data);
    return response.data;
  }

  // Delete product category
  async deleteProductCategory(id: number, force: boolean = false): Promise<ProductCategory> {
    const response = await this.getClient().delete<ProductCategory>(`products/categories/${id}`, { force });
    return response.data;
  }

  // Get product tags
  async getProductTags(params?: ListParams): Promise<ProductTag[]> {
    const response = await this.getClient().get<unknown[]>('products/tags', params);
    return response.data.map((item) => ProductTagSchema.parse(item));
  }

  // Get single product tag
  async getProductTag(id: number): Promise<ProductTag> {
    const response = await this.getClient().get<unknown>(`products/tags/${id}`);
    return ProductTagSchema.parse(response.data);
  }

  // Create product tag
  async createProductTag(data: Partial<ProductTag>): Promise<ProductTag> {
    const response = await this.getClient().post<unknown>('products/tags', data);
    return ProductTagSchema.parse(response.data);
  }

  // Update product tag
  async updateProductTag(id: number, data: Partial<ProductTag>): Promise<ProductTag> {
    const response = await this.getClient().put<unknown>(`products/tags/${id}`, data);
    return ProductTagSchema.parse(response.data);
  }

  // Delete product tag
  async deleteProductTag(id: number, force: boolean = false): Promise<ProductTag> {
    const response = await this.getClient().delete<unknown>(`products/tags/${id}`, { force });
    return ProductTagSchema.parse(response.data);
  }

  // Get product shipping classes
  async getProductShippingClasses(params?: ListParams): Promise<ProductShippingClass[]> {
    const response = await this.getClient().get<unknown[]>('products/shipping_classes', params);
    return response.data.map((item) => ProductShippingClassSchema.parse(item));
  }

  // Get product reviews
  async getProductReviews(params?: ListParams): Promise<ProductReview[]> {
    const response = await this.getClient().get<ProductReview[]>('products/reviews', params);
    return response.data;
  }

  // Get single product review
  async getProductReview(id: number): Promise<ProductReview> {
    const response = await this.getClient().get<ProductReview>(`products/reviews/${id}`);
    return response.data;
  }

  // Create product review
  async createProductReview(data: Partial<ProductReview>): Promise<ProductReview> {
    const response = await this.getClient().post<ProductReview>('products/reviews', data);
    return response.data;
  }

  // Update product review
  async updateProductReview(id: number, data: Partial<ProductReview>): Promise<ProductReview> {
    const response = await this.getClient().put<ProductReview>(`products/reviews/${id}`, data);
    return response.data;
  }

  // Delete product review
  async deleteProductReview(id: number, force: boolean = false): Promise<ProductReview> {
    const response = await this.getClient().delete<ProductReview>(`products/reviews/${id}`, { force });
    return response.data;
  }

  // Get single shipping class
  async getProductShippingClass(id: number): Promise<ProductShippingClass> {
    const response = await this.getClient().get<unknown>(`products/shipping_classes/${id}`);
    return ProductShippingClassSchema.parse(response.data);
  }

  // Create shipping class
  async createProductShippingClass(data: Partial<ProductShippingClass>): Promise<ProductShippingClass> {
    const response = await this.getClient().post<unknown>('products/shipping_classes', data);
    return ProductShippingClassSchema.parse(response.data);
  }

  // Update shipping class
  async updateProductShippingClass(id: number, data: Partial<ProductShippingClass>): Promise<ProductShippingClass> {
    const response = await this.getClient().put<unknown>(`products/shipping_classes/${id}`, data);
    return ProductShippingClassSchema.parse(response.data);
  }

  // Delete shipping class
  async deleteProductShippingClass(id: number, force: boolean = false): Promise<ProductShippingClass> {
    const response = await this.getClient().delete<unknown>(`products/shipping_classes/${id}`, { force });
    return ProductShippingClassSchema.parse(response.data);
  }
}