import { TestDataGenerator } from '../__tests__/integration/html-generators';
import * as cheerio from 'cheerio';
import { detectPageType } from '../lib/ecommerce-extractor-strategies/detection';

const testHTML = TestDataGenerator.generateEcommerceHTML(3);
const $ = cheerio.load(testHTML);
const testURL = 'https://teststore.com/products';

console.log('URL:', testURL);
console.log('Product schema count:', $('[itemtype*="schema.org/Product"]').length);
console.log('Product element count:', $('.product, .product-item, [data-product-id]').length);

const pageType = detectPageType($, testURL);
console.log('Detected page type:', pageType);
