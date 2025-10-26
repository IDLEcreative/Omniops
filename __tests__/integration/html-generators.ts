/**
 * HTML Test Data Generators
 *
 * Utilities for generating various HTML fixtures for integration tests.
 * Includes e-commerce pages, template variations, and large content samples.
 */

export class TestDataGenerator {
  static generateEcommerceHTML(productCount: number = 1): string {
    const products = Array.from({ length: productCount }, (_, i) => `
      <div class="product" itemscope itemtype="https://schema.org/Product">
        <h1 itemprop="name" class="product-title">Amazing Product ${i + 1}</h1>
        <div class="price-container">
          <span class="price" itemprop="price">£${(29.99 + i * 10).toFixed(2)}</span>
          <meta itemprop="priceCurrency" content="GBP" />
        </div>
        <div class="sku" itemprop="sku">PROD-${String(i + 1).padStart(3, '0')}</div>
        <div class="description" itemprop="description">
          This is an amazing product with great features.
          It offers excellent value for money and comes with a warranty.
          Perfect for customers who want quality and reliability.
        </div>
        <div class="availability" itemprop="availability" content="https://schema.org/InStock">
          In Stock
        </div>
        <img src="/images/product${i + 1}.jpg" alt="Product ${i + 1}" itemprop="image" />
      </div>
    `).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>E-commerce Test Store</title>
        <meta name="description" content="Test store with amazing products" />
      </head>
      <body>
        <header class="site-header">
          <nav class="navigation">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/products">Products</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>
        </header>

        <main class="main-content">
          <h1>Our Products</h1>
          <div class="products-grid">
            ${products}
          </div>
        </main>

        <footer class="site-footer">
          <p>&copy; 2024 Test Store. All rights reserved.</p>
          <p>Contact us: info@teststore.com | Phone: +44 123 456 7890</p>
          <div class="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/shipping">Shipping Info</a>
          </div>
        </footer>
      </body>
      </html>
    `;
  }

  static generateTemplateVariationHTML(variation: number): string {
    const productNames = ['Laptop', 'Smartphone', 'Tablet', 'Headphones', 'Camera'];
    const prices = [999, 599, 399, 199, 1299];
    const skus = ['LAP-001', 'PHN-002', 'TAB-003', 'HDP-004', 'CAM-005'];

    return `
      <div class="product-card">
        <h2>${productNames[variation]}</h2>
        <div class="price-info">
          <span class="current-price">£${prices[variation]}</span>
          <span class="currency">GBP</span>
        </div>
        <div class="product-code">${skus[variation]}</div>
        <div class="stock-status">Available</div>
        <p class="product-summary">
          High-quality ${productNames[variation].toLowerCase()} with premium features.
          Excellent build quality and customer satisfaction guaranteed.
          Perfect for ${variation % 2 === 0 ? 'professionals' : 'consumers'}.
        </p>
      </div>
    `;
  }

  static generateLargeContentHTML(): string {
    const sections = Array.from({ length: 50 }, (_, i) => `
      <section class="content-section">
        <h2>Section ${i + 1}</h2>
        <p>This is a large content section with lots of text. ${Array.from({ length: 100 }, () => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ')}</p>
      </section>
    `).join('\n');

    return `
      <html>
        <body>
          <div class="large-content">
            ${sections}
          </div>
        </body>
      </html>
    `;
  }
}
