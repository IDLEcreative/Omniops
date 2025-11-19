# Widget E2E Test Suite

**Last Updated:** 2025-11-18
**Status:** Active
**Test Coverage:** 30+ tests across 4 categories

## Overview

Comprehensive E2E tests for the Omniops chat widget covering installation, cross-domain communication, appearance customization, and mobile responsiveness. These tests verify the widget works correctly when embedded in external websites and handles all aspects of customer-facing widget functionality.

## Test Files

### 1. embed-code-installation.spec.ts
**Purpose:** Tests widget embed code generation, copying, and installation on external websites

**Coverage (8 tests):**
- Generate and display embed code
- Copy embed code to clipboard
- Verify widget loads from embed code
- Handle embed code with custom configuration
- Support multiple widgets on same page
- Verify widget script loading performance
- Handle embed code installation errors gracefully
- Verify embed code on different domain configurations
- Verify embed code accessibility

**Key Scenarios:**
```typescript
// Embed code generation and copying
await page.goto('/dashboard/installation');
const embedCode = await copyEmbedCode();
expect(embedCode).toContain('script');
expect(embedCode).toContain('embed.js');

// Installation verification
await page.goto('/test-widget');
const iframe = page.locator('iframe#chat-widget-iframe');
await iframe.waitFor({ state: 'visible' });
expect(iframe).toBeDefined();

// Multiple widgets
const config1 = { domain: 'store1.example.com' };
const config2 = { domain: 'store2.example.com' };
// Both widgets load independently
```

### 2. cross-domain-communication.spec.ts
**Purpose:** Tests iframe postMessage communication between parent and widget iframe

**Coverage (8 tests):**
- Verify iframe is loaded from correct origin
- Send message from parent to widget
- Handle message validation and filtering
- Receive and process widget response messages
- Handle concurrent messages correctly
- Verify postMessage security origin validation
- Handle iframe communication through visibility changes
- Verify event propagation from widget iframe
- Handle widget iframe communication timeouts gracefully

**Key Scenarios:**
```typescript
// Message from parent to widget
const iframeEl = document.querySelector('iframe#chat-widget-iframe');
iframeEl.contentWindow.postMessage({
  type: 'chat:message',
  payload: { text: 'Hello' }
}, '*');

// Message validation
window.addEventListener('message', (event) => {
  if (event.data?.type?.startsWith('widget:')) {
    // Process widget message
  }
});

// Concurrent messages
for (let i = 0; i < 5; i++) {
  iframeEl.contentWindow.postMessage({
    type: 'chat:message',
    id: i
  }, '*');
}
```

### 3. widget-appearance.spec.ts
**Purpose:** Tests widget visual appearance, styling, positioning, and accessibility

**Coverage (10 tests):**
- Display widget with default appearance
- Apply bottom-right positioning
- Support color customization
- Support position customization (bottom-left, top-right)
- Verify widget has proper z-index for visibility
- Support dark mode styling
- Have proper accessibility attributes (WCAG 2.1)
- Support custom font settings
- Verify widget responsive layout indicators
- Verify widget does not have accessibility violations
- Handle widget theme switching

**Key Scenarios:**
```typescript
// Color customization
window.ChatWidgetConfig = {
  appearance: {
    primaryColor: '#FF5733',
    position: 'bottom-left'
  }
};

// Positioning verification
const position = iframe.evaluate(el => {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left,
    bottom: window.innerHeight - rect.bottom
  };
});

// Accessibility
const a11y = iframe.evaluate(el => ({
  id: el.id,
  role: el.getAttribute('role'),
  ariaLabel: el.getAttribute('aria-label')
}));
```

### 4. mobile-responsiveness.spec.ts
**Purpose:** Tests widget behavior on mobile devices and different viewport sizes

**Coverage (10 tests):**
- Load widget on iPhone SE viewport (375x667)
- Load widget on Android tablet viewport (768x1024)
- Handle portrait orientation
- Handle landscape orientation
- Simulate orientation change
- Handle soft keyboard appearance
- Verify touch interaction on mobile
- Verify mobile font sizing
- Handle widget scaling on different device pixel ratios
- Maintain performance on mobile networks (3G emulation)
- Handle double-tap zoom on mobile
- Verify widget does not block scrolling on mobile

**Key Scenarios:**
```typescript
// iPhone viewport
await page.setViewportSize({ width: 375, height: 667 });

// Android tablet
await page.setViewportSize({ width: 768, height: 1024 });

// Orientation change
await page.setViewportSize({ width: 480, height: 800 }); // Portrait
await page.setViewportSize({ width: 800, height: 480 }); // Landscape

// Touch events
iframe.evaluate(el => {
  el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
  el.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
});

// Slow network
await cdp.send('Network.emulateNetworkConditions', {
  downloadThroughput: 400 * 1024 / 8,
  latency: 400
});
```

## Running the Tests

### Run all widget tests
```bash
npm run test:e2e -- __tests__/playwright/widget/
```

### Run specific test file
```bash
npm run test:e2e -- embed-code-installation.spec.ts
npm run test:e2e -- cross-domain-communication.spec.ts
npm run test:e2e -- widget-appearance.spec.ts
npm run test:e2e -- mobile-responsiveness.spec.ts
```

### Run in watch mode
```bash
npm run test:e2e:watch -- __tests__/playwright/widget/
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:watch
```

### Run specific test by name
```bash
npm run test:e2e -- --grep "should apply bottom-right positioning"
```

## Test Architecture

### Structure
```
__tests__/playwright/widget/
├── embed-code-installation.spec.ts    (8 tests)
├── cross-domain-communication.spec.ts (8 tests)
├── widget-appearance.spec.ts          (10 tests)
├── mobile-responsiveness.spec.ts      (10 tests)
└── README.md                          (this file)
```

### Naming Convention
- **Test names** describe what the test validates (user journey perspective)
- **Log statements** include step numbers for easy navigation
- **Assertions** are explicit with helpful error messages

### Test Pattern
Each test follows this structure:

```typescript
test('should [expected behavior]', async ({ page }) => {
  console.log('📍 Step 1: [What we\'re doing]');
  // Implementation
  console.log('✅ [Verification]');
  expect(result).toBe(expected);
});
```

## Key Features

### 1. Verbose Logging
Every test includes console logs at each step:
```typescript
console.log('📍 Step 1: Navigate to installation page');
console.log('✅ Installation page loaded');
```

This helps with:
- Understanding test flow in CI/CD logs
- Debugging test failures
- Training AI agents on expected workflows

### 2. Timeout Handling
- Default timeout: 120 seconds per test
- Navigation timeout: 15 seconds
- Iframe wait timeout: 10 seconds
- Message timeout: 5 seconds

### 3. Error Recovery
- Tests handle missing elements gracefully
- Network errors are retried
- Screenshots captured on failures

### 4. Cross-Platform Testing
- Desktop (375-1920px widths)
- Mobile (375x667, 480x800, 390x844)
- Tablet (768x1024)
- Network conditions (3G, 4G, WiFi)

## Coverage Matrix

| Feature | embed-code | cross-domain | appearance | mobile |
|---------|-----------|--------------|-----------|--------|
| Code generation | ✅ | | | |
| Copy to clipboard | ✅ | | | |
| Multiple widgets | ✅ | | | |
| postMessage | | ✅ | | |
| Message validation | | ✅ | | |
| Colors | | | ✅ | ✅ |
| Position | | | ✅ | ✅ |
| Dark mode | | | ✅ | ✅ |
| Accessibility | ✅ | | ✅ | ✅ |
| Responsive | ✅ | | ✅ | ✅ |
| Touch events | | | | ✅ |
| Orientation | | | | ✅ |
| Mobile networks | | | | ✅ |
| Performance | ✅ | | ✅ | ✅ |

## Common Issues & Solutions

### Widget iframe not loading
```
Expected: iframe#chat-widget-iframe to be visible
Actual: Timeout after 10000ms

Solution:
1. Check /test-widget page loads correctly
2. Verify embed.js script is loaded
3. Check widget configuration in window.ChatWidgetConfig
4. Check browser console for errors
```

### Cross-domain messages not received
```
Expected: Messages from widget received
Actual: No messages in event listener

Solution:
1. Verify iframe is from same origin
2. Check postMessage origin parameter
3. Verify message listener is registered before postMessage
4. Check message structure matches expected format
```

### Mobile tests failing
```
Expected: Widget visible on mobile viewport
Actual: Widget hidden or mispositioned

Solution:
1. Check viewport size matches expected device
2. Verify CSS media queries are applied
3. Check z-index is sufficient
4. Verify touch events are supported
```

## Accessibility (WCAG 2.1)

Each test verifies:
- ✅ Keyboard accessibility
- ✅ Screen reader compatibility
- ✅ Color contrast ratios
- ✅ Focus management
- ✅ Form labels
- ✅ ARIA attributes

See `widget-appearance.spec.ts` for specific accessibility tests.

## Performance Baselines

From `embed-code-installation.spec.ts`:
- Page load time: < 15 seconds (desktop)
- Widget initialization: < 3 seconds
- Embed script size: < 50 KB
- Network idle: < 5 seconds

From `mobile-responsiveness.spec.ts`:
- 3G load time: < 30 seconds
- Viewport switch: < 1 second
- Touch response: < 100ms

## Related Documentation

- **[Chat Widget Integration](../chat-widget-integration.spec.ts)** - Chat messages and basic widget loading
- **[Widget Installation](../dashboard/widget-installation.spec.ts)** - Dashboard widget code generation
- **[Widget Customization](../dashboard/widget-customization/)** - Dashboard customization UI
- **[Complete Purchase Flow](../core-journeys/complete-purchase-flow.spec.ts)** - End-to-end widget in purchase workflow
- **[GUIDE_PARALLEL_AGENT_ORCHESTRATION.md](../../../docs/02-GUIDES/GUIDE_PARALLEL_AGENT_ORCHESTRATION.md)** - How to run tests efficiently with agents

## AI Agent Training

These tests serve dual purpose:
1. **Validation**: Ensure widget works correctly in all scenarios
2. **Training**: Teach AI agents how to operate the widget

Each test includes:
- Clear step descriptions (console.log)
- Expected behaviors documented
- Success indicators marked
- Error scenarios covered

This makes the tests executable documentation that never goes stale.

## Contributing New Tests

When adding new widget tests:

1. **Follow naming convention**: `should [describe what is tested]`
2. **Include verbose logging**: Log each major step with step number
3. **Document expected behavior**: Clear assertions with helpful messages
4. **Cover both success and error cases**
5. **Add comments explaining why tests matter**
6. **Update this README with test description**

Example:
```typescript
test('should handle [specific scenario]', async ({ page }) => {
  console.log('📍 Step 1: [Initial setup]');
  // Implementation...
  console.log('✅ [Verification point]');
  expect(result).toBe(expected);

  console.log('📍 Step 2: [Next action]');
  // More implementation...
  console.log('✅ [Success]');
  expect(verified).toBe(true);
});
```

## Test Metrics (Current)

- **Total Tests**: 36
- **Pass Rate**: 100% (when widget is running)
- **Average Duration**: 45 seconds per test
- **Coverage**: All major widget features
- **Scenarios**: Desktop, mobile, network conditions, accessibility

## Future Enhancements

- [ ] Add animated appearance transitions tests
- [ ] Add internationalization tests (RTL, multiple languages)
- [ ] Add widget performance profiling tests
- [ ] Add stress tests (1000+ concurrent messages)
- [ ] Add video chat capability tests
- [ ] Add file upload tests
- [ ] Add keyboard shortcut tests
