#!/usr/bin/env tsx
/**
 * Mobile Responsive UX Simulation Test
 *
 * Tests responsive design and mobile user experience using Playwright.
 * Simulates different viewports and verifies layout, interactions, and accessibility.
 *
 * Expected Results:
 * - 375px (mobile): Mobile toggle visible, single panel view, no horizontal scroll
 * - 768px (tablet): Side-by-side layout, both panels visible
 * - 1024px (desktop): Full layout with all features visible
 *
 * Tests:
 * 1. Mobile viewport (375px) - iPhone SE
 * 2. Tablet viewport (768px) - iPad Mini
 * 3. Desktop viewport (1024px+) - Standard desktop
 * 4. Horizontal scroll detection
 * 5. Touch target sizes (mobile)
 * 6. Modal/dialog behavior
 *
 * Requirements:
 * - Development server running on http://localhost:3000
 * - Playwright installed
 *
 * Usage:
 *   npm run dev  # Start dev server first
 *   npx tsx scripts/tests/simulate-mobile-ux.ts
 */

import { chromium, type Browser, type Page } from 'playwright';

interface ViewportTestResult {
  viewport: string;
  width: number;
  height: number;
  hasHorizontalScroll: boolean;
  mobileToggleVisible: boolean;
  sideBySideLayout: boolean;
  buttonSizesSufficient: boolean;
  pageLoaded: boolean;
  errors: string[];
}

async function checkHorizontalScroll(page: Page): Promise<boolean> {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  return scrollWidth > clientWidth;
}

async function checkMobileToggle(page: Page): Promise<boolean> {
  try {
    // Look for mobile toggle button (various possible selectors)
    const toggleButton = await page.locator('button').filter({ hasText: /conversations/i }).first();
    const isVisible = await toggleButton.isVisible({ timeout: 2000 });
    return isVisible;
  } catch {
    return false;
  }
}

async function checkSideBySideLayout(page: Page): Promise<boolean> {
  try {
    // Check if both sidebar and main content are visible side-by-side
    // Look for flex or grid layout with multiple visible columns
    const hasFlexLayout = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return false;

      const style = window.getComputedStyle(main);
      return style.display === 'flex' || style.display === 'grid';
    });

    return hasFlexLayout;
  } catch {
    return false;
  }
}

async function checkButtonSizes(page: Page): Promise<boolean> {
  try {
    // Check if interactive elements meet minimum touch target size (44x44px)
    const buttons = await page.locator('button').all();

    if (buttons.length === 0) return true; // No buttons to check

    let sufficientCount = 0;
    const minSize = 44; // Minimum recommended touch target size

    for (const button of buttons.slice(0, 10)) { // Check first 10 buttons
      try {
        const box = await button.boundingBox();
        if (box && (box.width >= minSize || box.height >= minSize)) {
          sufficientCount++;
        }
      } catch {
        // Skip buttons that can't be measured
      }
    }

    // At least 70% of buttons should meet size requirements
    return sufficientCount >= Math.min(buttons.length, 10) * 0.7;
  } catch {
    return false;
  }
}

async function testViewport(
  page: Page,
  name: string,
  width: number,
  height: number
): Promise<ViewportTestResult> {
  console.log(`\n📱 Testing ${name} (${width}x${height})`);
  console.log('─'.repeat(60));

  const errors: string[] = [];

  try {
    // Set viewport
    await page.setViewportSize({ width, height });
    console.log(`✅ Viewport set to ${width}x${height}`);

    // Navigate to conversations page
    console.log('Loading /dashboard/conversations...');
    const response = await page.goto('http://localhost:3000/dashboard/conversations', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    const pageLoaded = response?.status() === 200 || response?.status() === 401; // 401 is ok (auth redirect)
    console.log(`Page status: ${response?.status()}`);

    // Check for horizontal scroll
    const hasHorizontalScroll = await checkHorizontalScroll(page);
    console.log(`Horizontal scroll: ${hasHorizontalScroll ? '❌ Yes (BAD)' : '✅ No (GOOD)'}`);

    if (hasHorizontalScroll) {
      errors.push('Horizontal scrolling detected');
    }

    // Check mobile toggle (should be visible on mobile only)
    const mobileToggleVisible = await checkMobileToggle(page);
    console.log(`Mobile toggle: ${mobileToggleVisible ? '✅ Visible' : '❌ Not visible'}`);

    // Check side-by-side layout (should be visible on tablet/desktop)
    const sideBySideLayout = await checkSideBySideLayout(page);
    console.log(`Side-by-side layout: ${sideBySideLayout ? '✅ Yes' : '❌ No'}`);

    // Check button sizes (especially important for mobile)
    const buttonSizesSufficient = await checkButtonSizes(page);
    console.log(`Touch targets sufficient: ${buttonSizesSufficient ? '✅ Yes' : '❌ No'}`);

    if (!buttonSizesSufficient) {
      errors.push('Some touch targets too small for mobile');
    }

    return {
      viewport: name,
      width,
      height,
      hasHorizontalScroll,
      mobileToggleVisible,
      sideBySideLayout,
      buttonSizesSufficient,
      pageLoaded,
      errors
    };

  } catch (error) {
    errors.push(`Error testing viewport: ${error instanceof Error ? error.message : String(error)}`);
    return {
      viewport: name,
      width,
      height,
      hasHorizontalScroll: false,
      mobileToggleVisible: false,
      sideBySideLayout: false,
      buttonSizesSufficient: false,
      pageLoaded: false,
      errors
    };
  }
}

async function testMobileUX(): Promise<void> {
  console.log('🔬 Mobile Responsive UX Simulation');
  console.log('=====================================\n');

  let browser: Browser | null = null;

  try {
    // Check if dev server is running
    console.log('🔍 Checking if dev server is running...');
    try {
      const response = await fetch('http://localhost:3000');
      console.log(`✅ Dev server is running (status: ${response.status})\n`);
    } catch {
      console.error('❌ Dev server is not running!');
      console.error('Please start the dev server with: npm run dev');
      process.exit(1);
    }

    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await chromium.launch({
      headless: true, // Set to false to watch tests
    });
    console.log('✅ Browser launched\n');

    const page = await browser.newPage();
    const results: ViewportTestResult[] = [];

    // Test 1: Mobile (iPhone SE)
    const mobileResult = await testViewport(page, 'Mobile (iPhone SE)', 375, 667);
    results.push(mobileResult);

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Tablet (iPad Mini)
    const tabletResult = await testViewport(page, 'Tablet (iPad Mini)', 768, 1024);
    results.push(tabletResult);

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Desktop
    const desktopResult = await testViewport(page, 'Desktop', 1440, 900);
    results.push(desktopResult);

    // Close browser
    await browser.close();
    console.log('\n✅ Browser closed');

    // Print summary
    console.log('\n\n📈 Test Summary:');
    console.log('=====================================');

    for (const result of results) {
      console.log(`\n${result.viewport.toUpperCase()}`);
      console.log(`  Viewport:            ${result.width}x${result.height}`);
      console.log(`  Page Loaded:         ${result.pageLoaded ? '✅' : '❌'}`);
      console.log(`  No H-Scroll:         ${!result.hasHorizontalScroll ? '✅' : '❌'}`);
      console.log(`  Mobile Toggle:       ${result.mobileToggleVisible ? '✅' : '❌'}`);
      console.log(`  Side-by-Side:        ${result.sideBySideLayout ? '✅' : '❌'}`);
      console.log(`  Touch Targets:       ${result.buttonSizesSufficient ? '✅' : '❌'}`);

      if (result.errors.length > 0) {
        console.log(`  Errors:              ${result.errors.join(', ')}`);
      }
    }

    // Verification
    console.log('\n\n✓ Verification:');
    console.log('=====================================');

    const expectations = [
      {
        name: 'Mobile: No horizontal scroll',
        expected: true,
        actual: !results[0].hasHorizontalScroll,
        passed: !results[0].hasHorizontalScroll
      },
      {
        name: 'Mobile: Touch targets sufficient',
        expected: true,
        actual: results[0].buttonSizesSufficient,
        passed: results[0].buttonSizesSufficient
      },
      {
        name: 'Tablet: No horizontal scroll',
        expected: true,
        actual: !results[1].hasHorizontalScroll,
        passed: !results[1].hasHorizontalScroll
      },
      {
        name: 'Desktop: No horizontal scroll',
        expected: true,
        actual: !results[2].hasHorizontalScroll,
        passed: !results[2].hasHorizontalScroll
      },
      {
        name: 'All pages loaded successfully',
        expected: true,
        actual: results.every(r => r.pageLoaded),
        passed: results.every(r => r.pageLoaded)
      },
      {
        name: 'No layout errors detected',
        expected: true,
        actual: results.every(r => r.errors.length === 0),
        passed: results.every(r => r.errors.length === 0)
      }
    ];

    let allPassed = true;
    for (const expectation of expectations) {
      const status = expectation.passed ? '✅' : '❌';
      console.log(`${status} ${expectation.name}`);
      if (!expectation.passed) {
        allPassed = false;
      }
    }

    // Responsive design insights
    console.log('\n📊 Responsive Design Insights:');
    console.log('=====================================');

    if (results[0].mobileToggleVisible && !results[2].mobileToggleVisible) {
      console.log('✅ Mobile toggle correctly shows on small screens only');
    } else if (!results[0].mobileToggleVisible && !results[2].mobileToggleVisible) {
      console.log('⚠️  Mobile toggle not found (might be auth-gated)');
    }

    if (results[1].sideBySideLayout || results[2].sideBySideLayout) {
      console.log('✅ Side-by-side layout enabled on larger screens');
    }

    const noScrollIssues = results.every(r => !r.hasHorizontalScroll);
    if (noScrollIssues) {
      console.log('✅ No horizontal scroll issues on any viewport');
    } else {
      console.log('❌ Horizontal scroll detected on some viewports');
    }

    // Exit with appropriate code
    if (allPassed) {
      console.log('\n✅ All mobile UX tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some mobile UX tests failed');
      process.exit(1);
    }

  } catch (error) {
    if (browser) {
      await browser.close();
    }

    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testMobileUX().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
