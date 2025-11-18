# Mobile Shopping Experience E2E Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 6 minutes


**Purpose:** Comprehensive E2E test suite validating the next-level mobile shopping feed experience. These tests serve dual purpose: functional validation AND AI agent training data for autonomous operation.

**Last Updated:** 2025-11-16
**Status:** Active
**Test Count:** 5 comprehensive journey tests
**Related:** [E2E Tests as Agent Training](../../../docs/10-ANALYSIS/ANALYSIS_E2E_AS_AGENT_TRAINING_DATA.md)

---

## Overview

This test suite validates the complete mobile shopping journey from chat query to cart interaction, including:

- **Product Discovery**: Chat → Shopping feed transition
- **Gesture Navigation**: Swipe, double-tap, tap interactions
- **Product Details**: Expansion, image gallery, variant selection
- **Cart Operations**: Add to cart, cart badge, cart view
- **Performance**: 60fps animations, touch target sizes
- **Accessibility**: ARIA labels, high contrast, screen reader compatibility

---

## Test Files

### Main Test Suite

**`mobile-shopping-experience.spec.ts` (552 lines)**

Contains 5 comprehensive E2E test scenarios:

1. **Product Discovery to Add-to-Cart** (Primary Journey)
   - Chat query → Shopping feed transition
   - Swipe navigation between products
   - Tap to expand details
   - Select variants
   - Double-tap to add to cart
   - Verify cart indicator
   - Track analytics

2. **Swipe Navigation & Gestures**
   - Vertical swipe: Next/previous products
   - Horizontal swipe: Exit shopping mode
   - Double-tap: Quick add to cart
   - Animation performance: 60fps validation

3. **Product Detail Expansion**
   - Tap to expand
   - Image gallery scroll
   - Variant selection
   - Collapse on outside tap

4. **Cart Operations**
   - Add multiple items
   - Cart badge updates
   - Cart count validation
   - View cart action

5. **Accessibility & Performance**
   - Touch target sizes (iOS: 44x44px)
   - Animation FPS measurement
   - ARIA labels
   - Viewport validation

### Helper Utilities

**`helpers/mobile-shopping-helpers.ts` (426 lines)**

Reusable test utilities for mobile shopping interactions:

**Setup Functions:**
- `setMobileViewport()` - Configure iPhone X dimensions (375x812)
- `enableMobileFeatures()` - Enable touch events, animations
- `mockShoppingAPI()` - Mock product API responses

**Navigation Functions:**
- `waitForShoppingFeed()` - Wait for chat → shopping transition
- `getProductCardCount()` - Count visible products
- `verticalSwipe()` - Swipe up/down between products
- `horizontalSwipe()` - Swipe left/right to exit
- `doubleTap()` - Double-tap gesture

**Interaction Functions:**
- `tapProductCard()` - Tap to expand details
- `selectVariant()` - Choose product variant
- `tapOutside()` - Close expanded view
- `scrollImageGallery()` - Navigate product images

**Validation Functions:**
- `verifyProductDetailsExpanded()` - Check detail view
- `verifyCartIndicator()` - Validate cart badge
- `verifyAnimationPerformance()` - Measure FPS
- `verifyTouchTargetSize()` - Check accessibility
- `verifyTransitionToChat()` - Confirm mode switch
- `captureAnalyticsEvent()` - Track analytics

---

## Running the Tests

### Run All Shopping Tests
```bash
npm run test:e2e -- shopping/
```

### Run Specific Test
```bash
npm run test:e2e -- shopping/mobile-shopping-experience.spec.ts
```

### Interactive UI Mode (Recommended)
```bash
npm run test:e2e:watch
# Navigate to: shopping/mobile-shopping-experience.spec.ts
```

### Debug Mode (Step Through)
```bash
npm run test:e2e:debug -- shopping/mobile-shopping-experience.spec.ts
```

### Watch Mode (Auto-Rerun on Changes)
```bash
npm run test:e2e:watch-files
```

---

## Mobile Test Setup

### Viewport Configuration
```typescript
// iPhone X dimensions
await page.setViewportSize({ width: 375, height: 812 });
```

### Touch Events
```typescript
// Enable touch emulation
await page.emulateMedia({ reducedMotion: 'no-preference' });
```

### Gestures
```typescript
// Vertical swipe (product navigation)
await page.touchscreen.swipe(
  { x: 200, y: 600 }, // Start
  { x: 200, y: 200 }  // End
);

// Double-tap (add to cart)
await page.touchscreen.tap(x, y);
await page.waitForTimeout(100);
await page.touchscreen.tap(x, y);
```

---

## Test Coverage

### User Journeys (5 Complete Flows)

| Journey | Steps | Success Criteria | Agent Training Value |
|---------|-------|------------------|---------------------|
| **Product Discovery** | 14 | Shopping feed displays, cart updates | Learn shopping mode trigger |
| **Swipe Navigation** | 8 | Smooth 60fps navigation | Learn gesture patterns |
| **Detail Expansion** | 7 | Details expand, gallery scrolls | Learn interaction flow |
| **Cart Operations** | 9 | Multiple items, correct count | Learn cart state management |
| **Accessibility** | 7 | Touch targets, FPS, ARIA | Learn quality standards |

### Mobile-Specific Validations

**Gestures:**
- ✅ Vertical swipe up/down
- ✅ Horizontal swipe left/right
- ✅ Double-tap
- ✅ Single tap
- ✅ Tap outside

**Performance:**
- ✅ 60fps animations (≥55fps acceptable)
- ✅ Touch targets ≥44x44px (iOS standard)
- ✅ Smooth transitions

**Accessibility:**
- ✅ ARIA labels for screen readers
- ✅ Touch target sizes
- ✅ Viewport validation

---

## AI Agent Training Data

These tests teach AI agents how to:

1. **Trigger Shopping Mode**
   - Send product query in chat
   - Recognize shopping feed activation
   - Understand mode transitions

2. **Navigate Products**
   - Use swipe gestures correctly
   - Navigate between products
   - Exit shopping mode

3. **Interact with Products**
   - Expand product details
   - Select variants
   - Add items to cart
   - Manage cart state

4. **Validate Quality**
   - Check animation performance
   - Verify accessibility standards
   - Ensure mobile-friendly UX

### Workflow Extraction

After modifying tests, regenerate agent knowledge:

```bash
# Extract workflows from E2E tests
npx tsx scripts/extract-workflows-from-e2e.ts

# Generate agent knowledge base
npx tsx scripts/generate-agent-training-data.ts
```

This creates:
- `docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md`
- `docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md`
- `docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.json`

---

## Success Indicators

### Functional Validation
- ✅ All 5 test scenarios pass
- ✅ No console errors
- ✅ Screenshots captured on failure
- ✅ Analytics events tracked

### Performance Metrics
- ✅ Animation FPS ≥55 (target: 60)
- ✅ Touch targets ≥44x44px
- ✅ Transitions smooth and instant

### Agent Training Quality
- ✅ Step-by-step console logs
- ✅ Self-documenting selectors
- ✅ Complete journey coverage
- ✅ Error scenarios handled

---

## Common Issues & Solutions

### Issue: Shopping Feed Not Appearing

**Symptoms:**
- Test waits for `[data-testid="shopping-feed"]` but times out
- Chat stays in text mode

**Solutions:**
```typescript
// 1. Check if products array exists in API response
await mockShoppingAPI(page); // Must return products array

// 2. Verify data-testid on shopping feed component
// Components should have: data-testid="shopping-feed"

// 3. Increase timeout
await waitForShoppingFeed(iframe, 15000); // 15s instead of 10s
```

### Issue: Double-Tap Not Working

**Symptoms:**
- Double-tap doesn't add to cart
- Only single tap registered

**Solutions:**
```typescript
// 1. Adjust tap delay (300ms is standard)
await page.touchscreen.tap(x, y);
await page.waitForTimeout(100); // Reduce to 100ms
await page.touchscreen.tap(x, y);

// 2. Use bounding box for accurate coordinates
const box = await productCard.boundingBox();
const centerX = box.x + box.width / 2;
const centerY = box.y + box.height / 2;
await doubleTap(page, centerX, centerY);
```

### Issue: Cart Indicator Not Found

**Symptoms:**
- `verifyCartIndicator()` returns false
- Test fails on cart validation

**Solutions:**
```typescript
// 1. Check data-testid on cart badge component
// Component should have: data-testid="cart-badge"

// 2. Wait longer for cart update
await page.waitForTimeout(1500); // Increase from 1000ms

// 3. Use flexible selector
const cartBadge = iframe.locator(
  '[data-testid="cart-badge"], .cart-indicator, .cart-count'
);
```

---

## Related Documentation

- [E2E Tests as Agent Training Data](../../../docs/10-ANALYSIS/ANALYSIS_E2E_AS_AGENT_TRAINING_DATA.md)
- [Complete Purchase Flow Test](../core-journeys/complete-purchase-flow.spec.ts) - Example of gold standard
- [Chat Helpers](../../utils/playwright/chat-helpers.ts) - Shared utilities
- [Product Story Component](../../../components/shopping/ProductStory.tsx) - Component under test

---

## Maintenance

### When to Update Tests

1. **Shopping feed UI changes** → Update selectors and helpers
2. **New gestures added** → Add test scenarios
3. **Performance targets change** → Adjust FPS thresholds
4. **Accessibility standards update** → Update validation criteria

### Test Quality Checklist

- [ ] Verbose console.log for every step
- [ ] Self-documenting selectors (data-testid preferred)
- [ ] Complete journeys (to TRUE end)
- [ ] JSDoc comments on test scenarios
- [ ] Mobile-specific assertions
- [ ] Screenshots on failure
- [ ] Analytics verification

---

**Remember:** These tests are not just validation - they're teaching future AI agents how to operate the shopping experience autonomously!
