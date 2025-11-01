/**
 * WooCommerce Products API - Composition Class
 */

import type { WooCommerceClient } from '@/lib/woocommerce-types';
import { CoreProductsAPI } from './core';
import { VariationsAPI } from './variations';
import { AttributesAPI } from './attributes';
import { MetadataAPI } from './metadata';

export class ProductsAPI {
  private core: CoreProductsAPI;
  private variations: VariationsAPI;
  private attributes: AttributesAPI;
  private metadata: MetadataAPI;

  constructor(private getClient: () => WooCommerceClient) {
    this.core = new CoreProductsAPI(getClient);
    this.variations = new VariationsAPI(getClient);
    this.attributes = new AttributesAPI(getClient);
    this.metadata = new MetadataAPI(getClient);
  }

  // Core Products
  getProducts = (...args: Parameters<CoreProductsAPI['getProducts']>) => this.core.getProducts(...args);
  getProduct = (...args: Parameters<CoreProductsAPI['getProduct']>) => this.core.getProduct(...args);
  createProduct = (...args: Parameters<CoreProductsAPI['createProduct']>) => this.core.createProduct(...args);
  updateProduct = (...args: Parameters<CoreProductsAPI['updateProduct']>) => this.core.updateProduct(...args);
  deleteProduct = (...args: Parameters<CoreProductsAPI['deleteProduct']>) => this.core.deleteProduct(...args);
  batchProducts = (...args: Parameters<CoreProductsAPI['batchProducts']>) => this.core.batchProducts(...args);

  // Variations
  getProductVariations = (...args: Parameters<VariationsAPI['getProductVariations']>) => this.variations.getProductVariations(...args);
  getProductVariation = (...args: Parameters<VariationsAPI['getProductVariation']>) => this.variations.getProductVariation(...args);
  createProductVariation = (...args: Parameters<VariationsAPI['createProductVariation']>) => this.variations.createProductVariation(...args);
  updateProductVariation = (...args: Parameters<VariationsAPI['updateProductVariation']>) => this.variations.updateProductVariation(...args);
  deleteProductVariation = (...args: Parameters<VariationsAPI['deleteProductVariation']>) => this.variations.deleteProductVariation(...args);
  batchProductVariations = (...args: Parameters<VariationsAPI['batchProductVariations']>) => this.variations.batchProductVariations(...args);

  // Attributes
  getProductAttributes = (...args: Parameters<AttributesAPI['getProductAttributes']>) => this.attributes.getProductAttributes(...args);
  getProductAttribute = (...args: Parameters<AttributesAPI['getProductAttribute']>) => this.attributes.getProductAttribute(...args);
  createProductAttribute = (...args: Parameters<AttributesAPI['createProductAttribute']>) => this.attributes.createProductAttribute(...args);
  updateProductAttribute = (...args: Parameters<AttributesAPI['updateProductAttribute']>) => this.attributes.updateProductAttribute(...args);
  deleteProductAttribute = (...args: Parameters<AttributesAPI['deleteProductAttribute']>) => this.attributes.deleteProductAttribute(...args);
  getAttributeTerms = (...args: Parameters<AttributesAPI['getAttributeTerms']>) => this.attributes.getAttributeTerms(...args);
  getProductAttributeTerms = (...args: Parameters<AttributesAPI['getProductAttributeTerms']>) => this.attributes.getProductAttributeTerms(...args);
  getAttributeTerm = (...args: Parameters<AttributesAPI['getAttributeTerm']>) => this.attributes.getAttributeTerm(...args);
  createAttributeTerm = (...args: Parameters<AttributesAPI['createAttributeTerm']>) => this.attributes.createAttributeTerm(...args);
  createProductAttributeTerm = (...args: Parameters<AttributesAPI['createProductAttributeTerm']>) => this.attributes.createProductAttributeTerm(...args);
  updateAttributeTerm = (...args: Parameters<AttributesAPI['updateAttributeTerm']>) => this.attributes.updateAttributeTerm(...args);
  updateProductAttributeTerm = (...args: Parameters<AttributesAPI['updateProductAttributeTerm']>) => this.attributes.updateProductAttributeTerm(...args);
  deleteAttributeTerm = (...args: Parameters<AttributesAPI['deleteAttributeTerm']>) => this.attributes.deleteAttributeTerm(...args);
  deleteProductAttributeTerm = (...args: Parameters<AttributesAPI['deleteProductAttributeTerm']>) => this.attributes.deleteProductAttributeTerm(...args);

  // Metadata (Categories, Tags, Reviews, Shipping Classes)
  getProductCategories = (...args: Parameters<MetadataAPI['getProductCategories']>) => this.metadata.getProductCategories(...args);
  getProductCategory = (...args: Parameters<MetadataAPI['getProductCategory']>) => this.metadata.getProductCategory(...args);
  createProductCategory = (...args: Parameters<MetadataAPI['createProductCategory']>) => this.metadata.createProductCategory(...args);
  updateProductCategory = (...args: Parameters<MetadataAPI['updateProductCategory']>) => this.metadata.updateProductCategory(...args);
  deleteProductCategory = (...args: Parameters<MetadataAPI['deleteProductCategory']>) => this.metadata.deleteProductCategory(...args);
  getProductTags = (...args: Parameters<MetadataAPI['getProductTags']>) => this.metadata.getProductTags(...args);
  getProductTag = (...args: Parameters<MetadataAPI['getProductTag']>) => this.metadata.getProductTag(...args);
  createProductTag = (...args: Parameters<MetadataAPI['createProductTag']>) => this.metadata.createProductTag(...args);
  updateProductTag = (...args: Parameters<MetadataAPI['updateProductTag']>) => this.metadata.updateProductTag(...args);
  deleteProductTag = (...args: Parameters<MetadataAPI['deleteProductTag']>) => this.metadata.deleteProductTag(...args);
  getProductShippingClasses = (...args: Parameters<MetadataAPI['getProductShippingClasses']>) => this.metadata.getProductShippingClasses(...args);
  getProductShippingClass = (...args: Parameters<MetadataAPI['getProductShippingClass']>) => this.metadata.getProductShippingClass(...args);
  createProductShippingClass = (...args: Parameters<MetadataAPI['createProductShippingClass']>) => this.metadata.createProductShippingClass(...args);
  updateProductShippingClass = (...args: Parameters<MetadataAPI['updateProductShippingClass']>) => this.metadata.updateProductShippingClass(...args);
  deleteProductShippingClass = (...args: Parameters<MetadataAPI['deleteProductShippingClass']>) => this.metadata.deleteProductShippingClass(...args);
  getProductReviews = (...args: Parameters<MetadataAPI['getProductReviews']>) => this.metadata.getProductReviews(...args);
  getProductReview = (...args: Parameters<MetadataAPI['getProductReview']>) => this.metadata.getProductReview(...args);
  createProductReview = (...args: Parameters<MetadataAPI['createProductReview']>) => this.metadata.createProductReview(...args);
  updateProductReview = (...args: Parameters<MetadataAPI['updateProductReview']>) => this.metadata.updateProductReview(...args);
  deleteProductReview = (...args: Parameters<MetadataAPI['deleteProductReview']>) => this.metadata.deleteProductReview(...args);
}

// Re-export types
export * from './types';
