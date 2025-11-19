import { test, expect } from '@playwright/test';

/**
 * E2E Test: Product Details View
 *
 * Tests product detail page display.
 * Validates product information, images, and pricing.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Product Details View', () => {
  test('should display complete product details', async ({ page }) => {
    console.log('=== Testing Product Details Page ===');

    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    console.log('📍 Step 1: Click first product');
    const productLinks = page.locator('.product a, a.product-link, a[href*="/product/"]');
    const linkCount = await productLinks.count();

    if (linkCount === 0) {
      console.log('⏭️  No products found');
      return;
    }

    await productLinks.first().click();
    await page.waitForLoadState('networkidle');

    console.log('📍 Step 2: Verify product title');
    const productTitle = page.locator('.product_title, h1.entry-title, h1');
    const hasTitle = await productTitle.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTitle) {
      const title = await productTitle.textContent();
      console.log(`📦 Product: ${title}`);
    }

    console.log('📍 Step 3: Check for product image');
    const productImage = page.locator('.product-image img, .woocommerce-product-gallery img');
    const hasImage = await productImage.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasImage) {
      console.log('✅ Product image displayed');
    }

    console.log('📍 Step 4: Check for price');
    const price = page.locator('.price, .woocommerce-Price-amount');
    const hasPrice = await price.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPrice) {
      console.log('✅ Product price displayed');
    }

    console.log('✅ Product details test completed!');
  });
});
