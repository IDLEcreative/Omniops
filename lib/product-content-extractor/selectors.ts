/**
 * WooCommerce and e-commerce selectors
 */

export const wooCommerceSelectors = {
  name: 'h1.product_title, .product-title h1, .entry-title',
  price: '.price ins .amount, .price > .amount, .price-now, .product-price',
  regularPrice: '.price del .amount, .price .regular-price, .was-price',
  sku: '.sku, .product-sku, .product_meta .sku_wrapper .sku',
  description: '.woocommerce-product-details__short-description, .product-short-description, .summary .description',
  availability: '.stock, .availability, .in-stock, .out-of-stock',
  category: '.posted_in a, .product-category a, .product_meta .posted_in a',
};

export const priceSelectors = [
  '.price ins .amount', // Sale price in WooCommerce
  '.price > .amount',   // Regular price display
  '.product-price',
  '.price-now',
  'span[itemprop="price"]',
  '.price .woocommerce-Price-amount',
  '[data-price]',
];
