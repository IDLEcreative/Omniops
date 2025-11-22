# Test Separation Strategy for Browse Products Button Issue

**Date:** 2025-11-22
**Issue:** Browse Products button not appearing despite server returning metadata
**Current Test:** `mobile-shopping-core.spec.ts:42` - Monolithic E2E test (133 lines)

---

## Problem with Current Test Structure

**Current test (lines 42-174):**
```
Setup (lines 56-84)
  ↓
Send message (line 93)
  ↓
Wait for button (line 98) ❌ FAILS HERE
  ↓
Click button (line 102)
  ↓
Shopping feed interactions (lines 106-155)
  ↓
Cart verification (lines 152-165)
```

**Why this is hard to debug:**
- Test fails at line 98 (button wait)
- We don't know if:
  - API returned metadata?
  - sendMessage transformed it correctly?
  - State was updated with metadata?
  - MessageList received metadata in props?
  - Button rendering logic is broken?

**All we know:** Button doesn't appear. We need to test each concern separately.

---

## Separation Strategy: Test Pyramid

```
         E2E Test (1)
       /            \
  Integration (2-3)   \
    /      |      \    \
Unit (4-7)              \
                         \
                    Component (8-9)
```

### Level 1: API Unit Test
**File:** `__tests__/api/chat/metadata-response.test.ts`
**Purpose:** Verify API returns shoppingMetadata in response
**Isolation:** Direct API call with mocked dependencies
**What it proves:** Server-side works (already proven via curl, but automated)

### Level 2: sendMessage Unit Test
**File:** `__tests__/lib/sendMessage-transformation.test.ts`
**Purpose:** Verify sendMessage transforms API response to message metadata
**Isolation:** Mock fetch, test transformation logic
**What it proves:** Client transformation works

### Level 3: MessageList Component Test
**File:** `__tests__/components/MessageList-button-render.test.ts`
**Purpose:** Verify MessageList renders button when metadata exists
**Isolation:** Render component with mock message containing metadata
**What it proves:** Button rendering logic works

### Level 4: Widget State Integration Test
**File:** `__tests__/integration/widget-state-metadata.test.ts`
**Purpose:** Verify metadata flows through widget state management
**Isolation:** Simulate full widget lifecycle with mocked API
**What it proves:** State management preserves metadata

### Level 5: Minimal E2E Reproduction Test
**File:** `__tests__/playwright/isolated/metadata-button-minimal.spec.ts`
**Purpose:** Minimal E2E test focused ONLY on button appearance
**Isolation:** Widget load → message send → button wait (no shopping feed interactions)
**What it proves:** Real browser environment metadata flow

### Level 6: Full E2E Test (Current)
**File:** `__tests__/playwright/shopping/mobile-shopping-core.spec.ts:42`
**Purpose:** Complete user journey validation
**Keep for:** End-to-end confidence, but not for debugging

---

## Implementation Plan

### Phase 1: Create Minimal E2E Test (Fastest to Implement)
**Priority:** Highest - Will immediately show if issue is in metadata flow or shopping feed

```typescript
// __tests__/playwright/isolated/metadata-button-minimal.spec.ts
test('Browse Products button appears after product query', async ({ page }) => {
  console.log('📍 Load widget');
  await page.goto('http://localhost:3000/widget-test');
  const iframe = await waitForChatWidget(page);

  console.log('📍 Send product query');
  await sendChatMessage(iframe, 'Do you have any pumps?');

  console.log('📍 Wait for button (ONLY concern)');
  const button = iframe.locator('[data-testid="browse-products-button"]');
  await button.waitFor({ state: 'visible', timeout: 60000 });

  console.log('✅ Button appeared - metadata flow works!');
  // Don't click button - don't test shopping feed
  // This test ONLY validates button appearance
});
```

**If this test:**
- ✅ **Passes** → Issue is in shopping feed interactions (lines 102+)
- ❌ **Fails** → Issue is in metadata flow (API → state → render)

### Phase 2: Create Component Unit Test
**Priority:** High - Eliminates button rendering as the issue

```typescript
// __tests__/components/MessageList-button-render.test.ts
test('renders Browse Products button when metadata exists', () => {
  const mockMessage: Message = {
    id: '123',
    role: 'assistant',
    content: 'Here are some products',
    metadata: {
      shoppingProducts: [
        { id: '1', name: 'Pump', price: 100 },
        // ... 49 more products
      ],
      shoppingContext: 'pumps'
    }
  };

  render(<MessageList messages={[mockMessage]} />);

  const button = screen.getByTestId('browse-products-button');
  expect(button).toBeInTheDocument();
});
```

**If this test:**
- ✅ **Passes** → Button rendering logic works, issue is in data flow
- ❌ **Fails** → Button rendering logic is broken

### Phase 3: Create sendMessage Unit Test
**Priority:** Medium - Validates transformation logic

```typescript
// __tests__/lib/sendMessage-transformation.test.ts
test('transforms API shoppingMetadata to message metadata', async () => {
  const mockApiResponse = {
    message: 'Here are products',
    conversation_id: 'abc',
    shoppingMetadata: {
      products: [{ id: '1', name: 'Pump' }],
      context: 'pumps',
      productCount: 50
    }
  };

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => mockApiResponse
  });

  let capturedMessage: Message | null = null;
  await sendChatMessage({
    userMessage: 'pumps',
    // ... other params
    onSuccess: (msg) => { capturedMessage = msg; }
  });

  expect(capturedMessage?.metadata?.shoppingProducts).toEqual(
    mockApiResponse.shoppingMetadata.products
  );
});
```

### Phase 4: Create Integration Test for State Flow
**Priority:** Medium - Validates full widget state management

```typescript
// __tests__/integration/widget-state-metadata.test.ts
test('metadata flows from API through state to MessageList', async () => {
  // Mock API to return metadata
  server.use(
    http.post('/api/chat', () => {
      return HttpResponse.json({
        message: 'Products found',
        shoppingMetadata: { products: [...], context: 'pumps' }
      });
    })
  );

  // Render full ChatWidget
  render(<ChatWidget />);

  // Send message
  const input = screen.getByRole('textbox');
  await userEvent.type(input, 'pumps{Enter}');

  // Wait for button
  const button = await screen.findByTestId('browse-products-button');
  expect(button).toBeInTheDocument();
});
```

---

## Diagnostic Decision Tree

```
Run Minimal E2E Test
    ↓
Passes? ──YES──> Issue is in shopping feed (lines 102+)
    |            → Original test has bug, not metadata flow
    NO
    ↓
Run Component Test (MessageList)
    ↓
Passes? ──YES──> Button logic works, issue is data not reaching component
    |            → Test sendMessage + state management
    NO
    ↓
Button rendering is broken
    → Fix MessageList.tsx rendering logic


If button logic works:
    ↓
Run sendMessage Unit Test
    ↓
Passes? ──YES──> Transformation works, issue is in state management
    |            → Check useMessageState, useChatState, race conditions
    NO
    ↓
Transformation is broken
    → Fix sendMessage.ts transformation logic
```

---

## Expected Outcomes

After running these tests, we will know EXACTLY where the issue is:

1. **All tests pass** → Original E2E test has environment/timing issue
2. **E2E fails, Component passes** → Data not reaching component (state issue)
3. **Component fails** → Button rendering logic broken
4. **sendMessage fails** → Transformation logic broken
5. **Integration fails** → State management broken

**Current Hypothesis:** Component test will pass (logic is correct), but E2E will fail (data not reaching component due to runtime state issue).

---

## Next Steps

1. **Implement Phase 1** (Minimal E2E) - 5 minutes
2. **Run test and observe result**
3. **Implement Phase 2** (Component test) - 10 minutes
4. **Based on results, proceed to Phase 3 or 4**
5. **Once root cause identified, fix and verify**

**Estimated Time to Root Cause:** 30-45 minutes with separated tests vs. hours of blind debugging.
