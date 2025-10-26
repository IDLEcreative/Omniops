/**
 * HTML Generators for Test Data
 * Helper functions for generating HTML components used in test data
 */

export class HTMLGenerators {
  /**
   * Generate header HTML
   */
  static generateHeader(): string {
    return `
        <header class="site-header main-header">
          <div class="header-container">
            <div class="logo">
              <img src="/logo.png" alt="Test Store" />
              <h1>Test Store</h1>
            </div>
            <nav class="main-navigation primary-nav">
              <ul class="nav-menu">
                <li><a href="/">Home</a></li>
                <li><a href="/products" class="current">Products</a></li>
                <li><a href="/categories">Categories</a></li>
                <li><a href="/brands">Brands</a></li>
                <li><a href="/sale">Sale</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </nav>
            <div class="header-actions">
              <div class="search-box">
                <input type="search" placeholder="Search products..." />
                <button type="submit">Search</button>
              </div>
              <div class="user-actions">
                <a href="/account">Account</a>
                <a href="/cart" class="cart-link">Cart (0)</a>
              </div>
            </div>
          </div>
        </header>`;
  }

  /**
   * Generate main content area HTML
   */
  static generateMainContent(products: string, productCount: number, pagination: string): string {
    return `
        <main class="main-content products-page" role="main">
          <div class="breadcrumbs">
            <nav aria-label="Breadcrumb">
              <ol>
                <li><a href="/">Home</a></li>
                <li><a href="/products">Products</a></li>
                <li aria-current="page">Premium Collection</li>
              </ol>
            </nav>
          </div>

          <div class="page-header">
            <h1>Premium Product Collection</h1>
            <p class="category-description">Discover our carefully curated selection of premium products.</p>
          </div>

          <div class="products-container">
            <aside class="sidebar filters-sidebar">
              <h3>Filter Products</h3>
              <div class="filter-group">
                <h4>Price Range</h4>
                <input type="range" min="0" max="500" />
                <span>£0 - £500</span>
              </div>
              <div class="filter-group">
                <h4>Brand</h4>
                <label><input type="checkbox" /> TechBrand</label>
                <label><input type="checkbox" /> ProMaker</label>
                <label><input type="checkbox" /> QualityFirst</label>
              </div>
              <div class="filter-group">
                <h4>Availability</h4>
                <label><input type="checkbox" /> In Stock</label>
                <label><input type="checkbox" /> Out of Stock</label>
              </div>
            </aside>

            <div class="products-main">
              <div class="products-toolbar">
                <div class="results-count">
                  Showing ${productCount} product${productCount !== 1 ? 's' : ''}
                </div>
                <div class="sort-options">
                  <select name="sort" id="sort-select">
                    <option value="name">Sort by Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Customer Rating</option>
                  </select>
                </div>
              </div>

              <div class="products-grid products-list" data-product-count="${productCount}">
                ${products}
              </div>

              ${pagination}
            </div>
          </div>
        </main>`;
  }

  /**
   * Generate footer HTML
   */
  static generateFooter(): string {
    return `
        <footer class="site-footer main-footer">
          <div class="footer-content">
            <div class="footer-section">
              <h4>Customer Service</h4>
              <ul>
                <li><a href="/help">Help Center</a></li>
                <li><a href="/contact">Contact Us</a></li>
                <li><a href="/returns">Returns & Exchanges</a></li>
                <li><a href="/shipping">Shipping Information</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="/about">About Us</a></li>
                <li><a href="/careers">Careers</a></li>
                <li><a href="/press">Press</a></li>
                <li><a href="/investors">Investors</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/cookies">Cookie Policy</a></li>
                <li><a href="/accessibility">Accessibility</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2024 Test Store. All rights reserved.</p>
            <p>Contact: support@teststore.com | +44 20 1234 5678</p>
          </div>
        </footer>`;
  }

  /**
   * Generate website structured data
   */
  static generateWebsiteStructuredData(): string {
    return `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Test Store",
          "url": "https://teststore.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://teststore.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }
        </script>`;
  }

  /**
   * Generate product HTML with structured data
   */
  static generateProduct(index: number, config: {
    includeStructuredData?: boolean;
    includeReviews?: boolean;
  }): string {
    const product = {
      name: `Premium Product ${index + 1}`,
      price: (49.99 + index * 25).toFixed(2),
      sku: `PREM-${String(index + 1).padStart(3, '0')}`,
      description: `High-quality premium product with advanced features. Perfect for ${index % 2 === 0 ? 'professionals' : 'everyday users'}. Includes warranty and support.`,
      availability: index % 3 === 0 ? 'OutOfStock' : 'InStock',
      category: ['Electronics', 'Computers', 'Accessories'][index % 3],
      brand: ['TechBrand', 'ProMaker', 'QualityFirst'][index % 3],
      rating: (4.0 + Math.random() * 1).toFixed(1),
      reviewCount: Math.floor(Math.random() * 200) + 50
    };

    const structuredData = config.includeStructuredData ? `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": "${product.name}",
          "image": "/images/product${index + 1}.jpg",
          "description": "${product.description}",
          "sku": "${product.sku}",
          "brand": {
            "@type": "Brand",
            "name": "${product.brand}"
          },
          "offers": {
            "@type": "Offer",
            "url": "/product/${product.sku.toLowerCase()}",
            "priceCurrency": "GBP",
            "price": "${product.price}",
            "availability": "https://schema.org/${product.availability}"
          }
        }
        </script>
      ` : '';

    const reviews = config.includeReviews ? `
        <div class="reviews-section">
          <h3>Customer Reviews (${product.reviewCount})</h3>
          <div class="rating-summary">
            <span class="average-rating">${product.rating}</span>
            <span class="rating-stars">★★★★★</span>
          </div>
          <div class="review">
            <h4>Excellent product!</h4>
            <p>Really happy with this purchase. Great quality and fast delivery.</p>
            <span class="reviewer">By John D.</span>
          </div>
        </div>
      ` : '';

    return `
        <article class="product product-item" data-product-id="${index + 1}" itemscope itemtype="https://schema.org/Product">
          ${structuredData}

          <div class="product-image">
            <img src="/images/product${index + 1}.jpg" alt="${product.name}" itemprop="image" class="product-photo" />
          </div>

          <div class="product-info">
            <h2 class="product-title product-name" itemprop="name">${product.name}</h2>

            <div class="product-price-container">
              <span class="price current-price" itemprop="price" content="${product.price}">£${product.price}</span>
              <meta itemprop="priceCurrency" content="GBP" />
            </div>

            <div class="product-meta">
              <span class="sku product-sku" itemprop="sku">SKU: ${product.sku}</span>
              <span class="brand" itemprop="brand">${product.brand}</span>
              <span class="category">${product.category}</span>
            </div>

            <div class="product-description" itemprop="description">
              <p>${product.description}</p>
            </div>

            <div class="availability-info">
              <span class="stock-status ${product.availability.toLowerCase()}" itemprop="availability" content="https://schema.org/${product.availability}">
                ${product.availability === 'InStock' ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div class="product-actions">
              <button class="add-to-cart btn-primary" data-product-id="${index + 1}">Add to Cart</button>
              <button class="wishlist-btn" data-product-id="${index + 1}">♡ Wishlist</button>
            </div>
          </div>

          ${reviews}
        </article>
      `;
  }

  /**
   * Generate pagination HTML
   */
  static generatePagination(): string {
    return `
      <nav class="pagination-nav" aria-label="Product pages">
        <ul class="pagination">
          <li><a href="?page=1" class="page-link current">1</a></li>
          <li><a href="?page=2" class="page-link">2</a></li>
          <li><a href="?page=3" class="page-link">3</a></li>
          <li><a href="?page=2" class="next-page">Next →</a></li>
        </ul>
      </nav>
    `;
  }
}
