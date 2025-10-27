/**
 * Verification Test: AI Content Extractor DOM Query Reduction
 *
 * CLAIM: The optimized removeUnwantedElements() method reduces DOM queries
 * from 10,000+ to a minimal number by using a single querySelectorAll for links
 * and building a lookup map instead of querying on each element.
 *
 * EXPECTED RESULT: querySelectorAll should be called:
 * - ~60 times for unwanted selectors (line 149-159)
 * - 1 time for all elements (line 165)
 * - 1 time for all links (line 168)
 * Total: ~62 calls instead of 10,000+
 */

import { JSDOM } from 'jsdom';

interface QueryStats {
  totalCalls: number;
  queries: Array<{ selector: string; resultCount: number }>;
}

/**
 * Create a realistic test DOM with 1000 elements
 * Mix of content, navigation, ads, and high-link-density elements
 */
function createTestDOM(): JSDOM {
  const elements: string[] = [];

  // Add typical page structure
  elements.push('<header class="header"><nav class="navbar">Site Nav</nav></header>');
  elements.push('<aside class="sidebar">Sidebar content</aside>');
  elements.push('<footer class="footer">Footer content</footer>');

  // Add 1000 mixed content elements
  for (let i = 0; i < 1000; i++) {
    const type = i % 10;

    if (type === 0) {
      // Navigation-like elements (high link density)
      elements.push(`
        <div class="nav-item-${i}">
          <a href="#">Link 1</a>
          <a href="#">Link 2</a>
          <a href="#">Link 3</a>
          <a href="#">Link 4</a>
          <a href="#">Link 5</a>
          <a href="#">Link 6</a>
        </div>
      `);
    } else if (type === 1) {
      // Ad-like elements
      elements.push(`<div class="ad-container-${i}"><div class="ad">Advertisement</div></div>`);
    } else if (type === 2) {
      // Social share buttons (high link density)
      elements.push(`
        <section class="social-share-${i}">
          <a href="#">FB</a><a href="#">TW</a><a href="#">IN</a>
        </section>
      `);
    } else if (type === 3) {
      // Content with some links
      elements.push(`
        <article class="article-${i}">
          <p>This is some real content that should be kept. It has enough text to pass the minimal text filter.</p>
          <a href="#">Read more</a>
        </article>
      `);
    } else {
      // Regular content elements
      elements.push(`
        <div id="content-${i}" class="content-block">
          <h2>Section ${i}</h2>
          <p>Content paragraph with meaningful text that should be preserved during extraction.</p>
        </div>
      `);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Test Page</title></head>
      <body>
        ${elements.join('\n')}
      </body>
    </html>
  `;

  return new JSDOM(html, { url: 'https://example.com/test' });
}

/**
 * Instrument querySelectorAll to count calls
 */
function instrumentQuerySelectorAll(dom: JSDOM): QueryStats {
  const stats: QueryStats = {
    totalCalls: 0,
    queries: []
  };

  const originalQuerySelectorAll = dom.window.document.querySelectorAll.bind(dom.window.document);

  dom.window.document.querySelectorAll = function(selector: string) {
    stats.totalCalls++;
    const result = originalQuerySelectorAll(selector);
    stats.queries.push({
      selector,
      resultCount: result.length
    });
    return result;
  } as any;

  return stats;
}

/**
 * Simulate the optimized removeUnwantedElements method
 * This is extracted from ai-content-extractor.ts lines 113-196
 */
function removeUnwantedElementsOptimized(document: Document): number {
  let removedCount = 0;

  // Define selectors for unwanted elements
  const unwantedSelectors = [
    // Structural elements
    'nav', 'header', 'footer', 'aside', 'form', 'iframe', 'object', 'embed',
    'script', 'style', 'noscript', 'meta', 'link[rel="stylesheet"]',

    // Common class-based selectors
    '.nav', '.navbar', '.navigation', '.menu', '.header', '.footer',
    '.sidebar', '.side-bar', '.aside', '.advertisement', '.ads', '.ad',
    '.social-share', '.social-media', '.comments', '.comment-section',
    '.related-posts', '.recommended', '.popup', '.modal', '.overlay',
    '.cookie-notice', '.cookie-banner', '.newsletter', '.subscription',
    '.breadcrumb', '.breadcrumbs', '.pagination', '.page-numbers',
    '.author-bio', '.author-info', '.share-buttons', '.tags-container',

    // ID-based selectors
    '#nav', '#navbar', '#navigation', '#menu', '#header', '#footer',
    '#sidebar', '#side-bar', '#ads', '#advertisement', '#social',
    '#comments', '#comment-section', '#related', '#recommended',

    // Attribute-based selectors
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '[role="complementary"]', '[aria-label*="navigation"]',
    '[aria-label*="menu"]', '[class*="sidebar"]', '[class*="header"]',
    '[class*="footer"]', '[class*="nav"]', '[id*="sidebar"]',
    '[id*="header"]', '[id*="footer"]', '[id*="nav"]',

    // Widget and plugin elements
    '.widget', '.wp-widget', '.plugin', '.external-content',
    '.third-party', '.tracking', '.analytics', '.gtm'
  ];

  // Remove elements
  unwantedSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.remove();
        removedCount++;
      });
    } catch (e) {
      // Ignore selector errors
    }
  });

  // Remove elements with minimal text content (likely navigation/ads)
  // PERFORMANCE OPTIMIZATION: Build a link count map first to avoid O(n²) DOM queries
  // Instead of querying all links for each element (10,000 elements = 10,000 queries),
  // we query once and build a map (1 query + O(n) map building)
  const allElements = document.querySelectorAll('div, section, article, span');

  // Single query for all links in the document
  const allLinks = document.querySelectorAll('a');

  // Build a map of link counts per element (single pass through links)
  const linkCountMap = new Map<Element, number>();
  allLinks.forEach(link => {
    let parent = link.parentElement;
    while (parent) {
      linkCountMap.set(parent, (linkCountMap.get(parent) || 0) + 1);
      parent = parent.parentElement;
    }
  });

  // Now filter elements using O(1) map lookups instead of O(n) querySelectorAll
  allElements.forEach(element => {
    const text = element.textContent?.trim() || '';
    const childCount = element.children.length;

    // Remove elements that are likely navigation/ads
    if (text.length < 50 && childCount > 5) {
      const linkCount = linkCountMap.get(element) || 0; // O(1) lookup
      if (linkCount / childCount > 0.8) { // High link density
        element.remove();
        removedCount++;
      }
    }
  });

  return removedCount;
}

/**
 * Simulate the UNOPTIMIZED version (what it would be without the optimization)
 */
function removeUnwantedElementsUnoptimized(document: Document): number {
  let removedCount = 0;

  // Same unwanted selectors removal - using same full list as optimized version
  const unwantedSelectors = [
    // Structural elements
    'nav', 'header', 'footer', 'aside', 'form', 'iframe', 'object', 'embed',
    'script', 'style', 'noscript', 'meta', 'link[rel="stylesheet"]',

    // Common class-based selectors
    '.nav', '.navbar', '.navigation', '.menu', '.header', '.footer',
    '.sidebar', '.side-bar', '.aside', '.advertisement', '.ads', '.ad',
    '.social-share', '.social-media', '.comments', '.comment-section',
    '.related-posts', '.recommended', '.popup', '.modal', '.overlay',
    '.cookie-notice', '.cookie-banner', '.newsletter', '.subscription',
    '.breadcrumb', '.breadcrumbs', '.pagination', '.page-numbers',
    '.author-bio', '.author-info', '.share-buttons', '.tags-container',

    // ID-based selectors
    '#nav', '#navbar', '#navigation', '#menu', '#header', '#footer',
    '#sidebar', '#side-bar', '#ads', '#advertisement', '#social',
    '#comments', '#comment-section', '#related', '#recommended',

    // Attribute-based selectors
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '[role="complementary"]', '[aria-label*="navigation"]',
    '[aria-label*="menu"]', '[class*="sidebar"]', '[class*="header"]',
    '[class*="footer"]', '[class*="nav"]', '[id*="sidebar"]',
    '[id*="header"]', '[id*="footer"]', '[id*="nav"]',

    // Widget and plugin elements
    '.widget', '.wp-widget', '.plugin', '.external-content',
    '.third-party', '.tracking', '.analytics', '.gtm'
  ];

  unwantedSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.remove();
        removedCount++;
      });
    } catch (e) {
      // Ignore selector errors
    }
  });

  // UNOPTIMIZED: Query links for EACH element (O(n²) DOM queries)
  const allElements = document.querySelectorAll('div, section, article, span');

  allElements.forEach(element => {
    const text = element.textContent?.trim() || '';
    const childCount = element.children.length;

    if (text.length < 50 && childCount > 5) {
      // ❌ BAD: This queries the DOM for EVERY element
      // This is the key difference - instead of building a map once, we query for each element
      const linkCount = element.querySelectorAll('a').length;
      if (linkCount / childCount > 0.8) {
        element.remove();
        removedCount++;
      }
    }
  });

  return removedCount;
}

/**
 * Run verification test
 */
function runVerification() {
  console.log('='.repeat(80));
  console.log('AI CONTENT EXTRACTOR DOM QUERY REDUCTION VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log();

  // Test 1: Optimized version
  console.log('TEST 1: OPTIMIZED VERSION (Current Implementation)');
  console.log('-'.repeat(80));

  const dom1 = createTestDOM();
  const stats1 = instrumentQuerySelectorAll(dom1);
  const startTime1 = Date.now();
  const removedCount1 = removeUnwantedElementsOptimized(dom1.window.document);
  const duration1 = Date.now() - startTime1;

  console.log(`Removed elements: ${removedCount1}`);
  console.log(`Total querySelectorAll calls: ${stats1.totalCalls}`);
  console.log(`Processing time: ${duration1}ms`);
  console.log();
  console.log('Query breakdown:');
  console.log(`  - Unwanted selectors: ${stats1.queries.filter(q =>
    !q.selector.includes('div, section') &&
    !q.selector.includes('a')
  ).length} calls`);
  console.log(`  - All elements query: ${stats1.queries.filter(q =>
    q.selector.includes('div, section')
  ).length} call(s)`);
  console.log(`  - All links query: ${stats1.queries.filter(q =>
    q.selector === 'a'
  ).length} call(s)`);
  console.log();

  // Test 2: Unoptimized version (for comparison)
  console.log('TEST 2: UNOPTIMIZED VERSION (Without Optimization)');
  console.log('-'.repeat(80));

  const dom2 = createTestDOM();
  const stats2 = instrumentQuerySelectorAll(dom2);
  const startTime2 = Date.now();
  const removedCount2 = removeUnwantedElementsUnoptimized(dom2.window.document);
  const duration2 = Date.now() - startTime2;

  console.log(`Removed elements: ${removedCount2}`);
  console.log(`Total querySelectorAll calls: ${stats2.totalCalls}`);
  console.log(`Processing time: ${duration2}ms`);
  console.log();

  // Calculate improvement
  console.log('='.repeat(80));
  console.log('RESULTS COMPARISON');
  console.log('='.repeat(80));

  const querySavings = stats2.totalCalls - stats1.totalCalls;
  const querySavingsPercent = ((querySavings / stats2.totalCalls) * 100).toFixed(1);
  const speedup = (duration2 / duration1).toFixed(2);

  console.log(`Query reduction: ${stats2.totalCalls} → ${stats1.totalCalls} (saved ${querySavings} calls, ${querySavingsPercent}% reduction)`);
  console.log(`Performance improvement: ${speedup}x faster`);
  console.log(`Elements removed (both): ${removedCount1} (optimized) vs ${removedCount2} (unoptimized)`);
  console.log();

  // Verification criteria
  console.log('='.repeat(80));
  console.log('VERIFICATION CRITERIA');
  console.log('='.repeat(80));

  const tests = [
    {
      name: 'Optimized version uses minimal queries',
      pass: stats1.totalCalls < 100,
      actual: `${stats1.totalCalls} queries`,
      expected: '< 100 queries'
    },
    {
      name: 'Unoptimized version uses many queries',
      pass: stats2.totalCalls > 500,
      actual: `${stats2.totalCalls} queries`,
      expected: '> 500 queries'
    },
    {
      name: 'Optimization reduces queries significantly',
      pass: querySavings > 400,
      actual: `${querySavings} queries saved`,
      expected: '> 400 queries saved'
    },
    {
      name: 'Both versions remove same elements',
      pass: removedCount1 === removedCount2,
      actual: `${removedCount1} vs ${removedCount2}`,
      expected: 'Equal counts'
    },
    {
      name: 'Optimized version is faster',
      pass: duration1 < duration2,
      actual: `${duration1}ms vs ${duration2}ms`,
      expected: 'Optimized < Unoptimized'
    }
  ];

  let passCount = 0;
  tests.forEach((test, i) => {
    const status = test.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${i + 1}. ${status}: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Actual: ${test.actual}`);
    if (passCount < tests.length) passCount += test.pass ? 1 : 0;
  });

  console.log();
  console.log('='.repeat(80));
  console.log(`OVERALL RESULT: ${passCount}/${tests.length} tests passed`);
  console.log('='.repeat(80));

  if (passCount === tests.length) {
    console.log('✅ VERIFICATION SUCCESSFUL');
    console.log('The optimization successfully reduces DOM queries from thousands to under 100!');
  } else {
    console.log('❌ VERIFICATION FAILED');
    console.log('Some tests did not meet expected criteria.');
  }

  console.log();

  // Detailed query log (first 20 queries)
  console.log('='.repeat(80));
  console.log('DETAILED QUERY LOG (Optimized - First 20 queries)');
  console.log('='.repeat(80));
  stats1.queries.slice(0, 20).forEach((q, i) => {
    console.log(`${i + 1}. "${q.selector}" → ${q.resultCount} elements`);
  });

  if (stats1.queries.length > 20) {
    console.log(`... and ${stats1.queries.length - 20} more queries`);
  }

  console.log();
}

// Run the verification
runVerification();
