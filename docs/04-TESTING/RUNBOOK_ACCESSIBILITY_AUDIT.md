# Accessibility Audit Runbook

**Type:** Runbook
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Accessibility Guide](/home/user/Omniops/docs/04-TESTING/GUIDE_ACCESSIBILITY_TESTING.md), [Accessibility Tests](/__tests__/accessibility/)
**Estimated Read Time:** 20 minutes

## Purpose

Step-by-step runbook for conducting a complete accessibility audit before major releases. Ensures WCAG 2.1 AA compliance and validates that all users, including those with disabilities, can effectively use the OmniOps platform.

## When to Use This Runbook

- ✅ Before major releases (v1.0, v2.0, etc.)
- ✅ After significant UI changes
- ✅ Quarterly compliance reviews
- ✅ Before customer demos (accessibility-conscious clients)
- ✅ When preparing for legal compliance audits

---

## Table of Contents

- [Pre-Audit Preparation](#pre-audit-preparation)
- [Automated Scanning](#automated-scanning)
- [Manual Testing](#manual-testing)
- [Screen Reader Testing](#screen-reader-testing)
- [Keyboard Navigation](#keyboard-navigation)
- [Color Contrast Verification](#color-contrast-verification)
- [Focus Management](#focus-management)
- [ARIA Usage Review](#aria-usage-review)
- [Remediation Tracking](#remediation-tracking)
- [WCAG 2.1 AA Compliance Verification](#wcag-21-aa-compliance-verification)
- [Sign-Off Checklist](#sign-off-checklist)

---

## Pre-Audit Preparation

### 1. Environment Setup

**Duration:** 10 minutes

**Steps:**
```bash
# ✅ Start dev server
npm run dev

# ✅ Verify server is running
curl http://localhost:3000
# Expected: 200 OK

# ✅ Install browser extensions
# - WAVE: https://wave.webaim.org/extension/
# - axe DevTools: https://www.deque.com/axe/devtools/
# - Lighthouse: Built into Chrome DevTools

# ✅ Install screen reader
# Windows: NVDA (https://www.nvaccess.org/download/)
# macOS: VoiceOver (built-in, enable in System Settings)
```

### 2. Create Audit Document

**Create:** `ARCHIVE/accessibility-audits/audit-YYYY-MM-DD.md`

**Template:**
```markdown
# Accessibility Audit - [Date]

**Auditor:** [Name]
**Platform Version:** v0.1.0
**WCAG Target:** 2.1 AA
**Browser:** Chrome/Firefox/Safari
**Screen Reader:** NVDA/VoiceOver

## Summary
- Issues Found: [count]
- Critical: [count]
- Major: [count]
- Minor: [count]

## Detailed Findings
[To be filled during audit]

## Remediation Plan
[To be filled after audit]
```

---

## Automated Scanning

### 1. Run axe Tests

**Duration:** 5 minutes

```bash
# ✅ Run all accessibility tests
npm run test:accessibility

# ✅ Review violations
cat __tests__/accessibility/reports/violations.json
```

**Success Criteria:**
- ✅ All tests pass
- ✅ 0 violations found
- ✅ No critical issues

**If failures occur:**
1. Note violation details
2. Add to remediation tracker
3. Continue audit (don't block)

### 2. WAVE Browser Extension

**Duration:** 15 minutes

**Steps:**
1. **Open homepage:** http://localhost:3000
2. **Click WAVE extension** icon
3. **Review results:**
   - Errors: RED flags (must fix)
   - Alerts: YELLOW flags (review)
   - Features: GREEN flags (good practices)
4. **Document findings** in audit document
5. **Repeat for key pages:**
   - /widget-test
   - /dashboard
   - /dashboard/settings
   - /dashboard/analytics

**Success Criteria:**
- ✅ 0 errors
- ✅ < 5 alerts (justified)

### 3. Lighthouse Accessibility Audit

**Duration:** 10 minutes

```bash
# ✅ Run Lighthouse
npx lhci autorun

# Or in Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Lighthouse tab
# 3. Select "Accessibility"
# 4. Generate report
```

**Success Criteria:**
- ✅ Accessibility score: 100
- ✅ All audits passing
- ✅ No manual checks needed

---

## Manual Testing

### 1. Visual Inspection

**Duration:** 20 minutes

**Checklist:**

**Images:**
- [ ] All images have alt text
- [ ] Decorative images have `alt=""`
- [ ] Alt text is descriptive (not "image" or "icon")
- [ ] No text in images (use real text)

**Forms:**
- [ ] All inputs have visible labels
- [ ] Labels are properly associated (`for` + `id`)
- [ ] Placeholder is NOT the only label
- [ ] Error messages are clearly visible
- [ ] Required fields are indicated

**Text:**
- [ ] Text can resize to 200% without breaking
- [ ] No text in all caps (screen reader issue)
- [ ] Line height ≥ 1.5 for paragraphs
- [ ] Paragraph width < 80 characters

**Color:**
- [ ] Information not conveyed by color alone
- [ ] Links distinguishable without color
- [ ] Buttons have clear visual state

### 2. Responsive Testing

**Test viewports:**
- [ ] Mobile: 375×667 (iPhone SE)
- [ ] Tablet: 768×1024 (iPad)
- [ ] Desktop: 1280×1024

**Verify for each:**
- [ ] All content accessible
- [ ] No horizontal scrolling
- [ ] Touch targets ≥ 44×44px
- [ ] Text readable without zoom

---

## Screen Reader Testing

### NVDA (Windows)

**Duration:** 30 minutes

**Setup:**
```
1. Start NVDA
2. Open http://localhost:3000 in browser
3. Use keyboard only (no mouse)
```

**Test Flow:**

**Homepage:**
```
Action: Insert + Down Arrow (read all)
✅ Verify: Page title announced
✅ Verify: Main heading announced
✅ Verify: Navigation links announced
✅ Verify: Content is in logical order
```

**Chat Widget:**
```
1. Tab to chat toggle button
   ✅ Verify: "Chat toggle button" announced
   ✅ Verify: State announced (collapsed/expanded)

2. Press Enter to open chat
   ✅ Verify: Chat opens
   ✅ Verify: Focus moves to input
   ✅ Verify: "Message input" announced

3. Type message
   ✅ Verify: Characters announced as typed

4. Tab to send button
   ✅ Verify: "Send button" announced

5. Press Enter
   ✅ Verify: Message sent
   ✅ Verify: Response announced via aria-live
```

**Dashboard:**
```
1. Navigate to /dashboard
   ✅ Verify: "Dashboard" announced
   ✅ Verify: Main navigation links announced

2. Tab through data table
   ✅ Verify: Column headers announced
   ✅ Verify: Row data announced correctly
   ✅ Verify: Can navigate cells with arrow keys

3. Activate filter
   ✅ Verify: Filter dialog announced
   ✅ Verify: Can interact with all controls
   ✅ Verify: Can close and return focus
```

**Document findings:**
```markdown
### Screen Reader Test Results (NVDA)

**Homepage:** ✅ Passed
- All content announced correctly
- Logical reading order

**Chat Widget:** ⚠️ Minor Issues
- Message timestamps not announced
  - Severity: Minor
  - Fix: Add sr-only text or aria-label

**Dashboard:** ✅ Passed
- Table navigation works well
- Filters accessible
```

### VoiceOver (macOS)

**Duration:** 30 minutes

**Setup:**
```
1. Enable VoiceOver (Cmd + F5)
2. Open http://localhost:3000 in Safari
3. Use keyboard only
```

**Commands:**
- `VO + A`: Read all
- `VO + Right Arrow`: Next element
- `VO + Space`: Activate element
- `VO + U`: Open rotor (lists)

**Test same flows as NVDA above.**

**Success Criteria:**
- ✅ All interactive elements announced
- ✅ Element purposes are clear
- ✅ Navigation is logical
- ✅ Dynamic updates announced
- ✅ Form errors announced

---

## Keyboard Navigation

### Full Keyboard Test

**Duration:** 20 minutes

**Tools:** Keyboard only, no mouse

**Test Flow:**

**Tab Order:**
```
1. Press Tab repeatedly
   ✅ Verify: Focus moves in logical order
   ✅ Verify: All interactive elements reachable
   ✅ Verify: No unexpected focus jumps
   ✅ Verify: Modal traps focus appropriately
```

**Skip Links:**
```
1. Load homepage
2. Press Tab once
   ✅ Verify: "Skip to main content" link appears
   ✅ Verify: Pressing Enter skips navigation
```

**Chat Widget:**
```
1. Tab to chat toggle → Press Enter
   ✅ Verify: Chat opens

2. Tab to input → Type message → Press Enter
   ✅ Verify: Message sends

3. Press Escape
   ✅ Verify: Chat closes
   ✅ Verify: Focus returns to toggle button
```

**Dashboard:**
```
1. Tab through navigation
   ✅ Verify: Can activate menu items with Enter

2. Tab through data table
   ✅ Verify: Can use Arrow keys to navigate cells
   ✅ Verify: Can sort columns (Enter on header)

3. Tab to filter button → Press Enter
   ✅ Verify: Filter dialog opens
   ✅ Verify: Tab moves through filter controls
   ✅ Verify: Escape closes dialog
   ✅ Verify: Focus returns to filter button
```

**Form Testing:**
```
1. Tab to form field
   ✅ Verify: Label announced

2. Enter invalid data → Submit
   ✅ Verify: Error message appears
   ✅ Verify: Focus moves to first error
   ✅ Verify: Error is announced
```

**Keyboard Traps:**
```
Test every modal, dropdown, menu:
✅ Verify: Can Tab into element
✅ Verify: Can Tab through all controls
✅ Verify: Can Tab/Escape out of element
❌ FAIL: If stuck and can't escape
```

---

## Color Contrast Verification

### Tool-Based Checks

**Duration:** 15 minutes

**1. WAVE Extension:**
```
1. Run WAVE on each page
2. Look for "Contrast" errors
3. Document all failures
```

**2. Chrome DevTools:**
```
1. Inspect element
2. Computed styles → Show accessibility tree
3. Look for contrast warnings
4. Fix all violations
```

**3. WebAIM Contrast Checker:**
```
URL: https://webaim.org/resources/contrastchecker/

For each color pair:
1. Enter foreground color
2. Enter background color
3. Verify: AA Normal Text ✅ (4.5:1)
4. Verify: AA Large Text ✅ (3:1)
```

### Manual Verification

**Common elements to check:**

**Text:**
- [ ] Body text on white background: ≥ 4.5:1
- [ ] Headings on colored background: ≥ 4.5:1
- [ ] Link text: ≥ 4.5:1
- [ ] Disabled text: ≥ 3:1

**UI Components:**
- [ ] Button text: ≥ 4.5:1
- [ ] Button borders: ≥ 3:1
- [ ] Input borders: ≥ 3:1
- [ ] Focus indicators: ≥ 3:1
- [ ] Icons: ≥ 3:1

**Document findings:**
```markdown
### Color Contrast Issues

| Element | FG | BG | Ratio | Required | Status |
|---------|----|----|-------|----------|--------|
| .muted-text | #999 | #FFF | 2.8:1 | 4.5:1 | ❌ FAIL |
| .button-secondary | #CCC | #FFF | 1.5:1 | 3:1 | ❌ FAIL |
```

---

## Focus Management

### Focus Indicator Test

**Duration:** 10 minutes

```bash
# Disable browser default focus styles (testing)
# Add to DevTools console:
document.body.style.cssText = '* { outline: none !important; }';

# Now tab through page - you should still see focus indicators
# from custom styles
```

**Checklist:**
- [ ] All focusable elements have visible indicator
- [ ] Indicator contrast ≥ 3:1
- [ ] Indicator visible on all backgrounds
- [ ] Indicator doesn't rely on color alone

**Test:**
1. Tab through entire page
2. Verify focus always visible
3. Verify focus moves in logical order
4. Verify focus doesn't jump unexpectedly

### Focus Trap Testing

**Modal dialogs:**
```
1. Open modal
   ✅ Focus moves into modal
   ✅ Tab cycles within modal
   ✅ Shift+Tab cycles backward
   ✅ Can't Tab out of modal
   ✅ Escape closes modal
   ✅ Focus returns to trigger
```

**Dropdown menus:**
```
1. Open dropdown
   ✅ Focus moves to first item
   ✅ Arrow keys navigate
   ✅ Enter selects
   ✅ Escape closes
   ✅ Focus returns to button
```

---

## ARIA Usage Review

### Common ARIA Patterns

**Duration:** 15 minutes

**Checklist:**

**Landmark Roles:**
```html
✅ <header> or role="banner"
✅ <nav> or role="navigation"
✅ <main> or role="main"
✅ <footer> or role="contentinfo"
```

**Live Regions (Chat):**
```html
✅ <div role="log" aria-live="polite">
     <!-- New messages announced -->
   </div>
```

**Form Validation:**
```html
✅ <input aria-invalid="true" aria-describedby="error" />
✅ <span id="error" role="alert">Error message</span>
```

**Button States:**
```html
✅ <button aria-pressed="true">Toggle</button>
✅ <button aria-expanded="false">Menu</button>
```

**Modals:**
```html
✅ <div role="dialog" aria-modal="true" aria-labelledby="title">
     <h2 id="title">Dialog Title</h2>
   </div>
```

### ARIA Anti-Patterns

**Avoid:**
```html
❌ <div role="button">Click</div>  <!-- Use <button> -->
❌ <a role="button">Submit</a>     <!-- Use <button> -->
❌ <span aria-label="Button">      <!-- Span isn't focusable -->
❌ <button role="link">            <!-- Conflicting semantics -->
```

---

## Remediation Tracking

### Issue Template

```markdown
## Issue #1: Chat Message Timestamps Not Announced

**Severity:** Minor
**WCAG Criterion:** 4.1.3 Status Messages
**Affected Pages:** /widget-test
**User Impact:** Screen reader users don't know message timing

**Current State:**
```html
<div class="timestamp">2:30 PM</div>
```

**Fix:**
```html
<div class="timestamp" aria-label="Sent at 2:30 PM">2:30 PM</div>
```

**Assigned To:** [Name]
**Due Date:** [Date]
**Status:** Open | In Progress | Fixed | Verified
```

### Priority Matrix

| Severity | Impact | Examples | Fix Timeline |
|----------|--------|----------|--------------|
| **Critical** | Blocks core functionality | Missing form labels, keyboard traps | Immediate |
| **Major** | Degrades experience | Low contrast, missing alt text | 1 week |
| **Minor** | Minor inconvenience | Missing aria-labels, small contrast issues | 2 weeks |
| **Cosmetic** | Nice to have | Inconsistent heading levels | 1 month |

---

## WCAG 2.1 AA Compliance Verification

### Principle 1: Perceivable

**1.1 Text Alternatives:**
- [ ] 1.1.1 Non-text Content: All images have alt text ✅

**1.2 Time-based Media:**
- [ ] 1.2.1 Audio-only/Video-only: N/A (no media)
- [ ] 1.2.2 Captions: N/A
- [ ] 1.2.3 Audio Description: N/A

**1.3 Adaptable:**
- [ ] 1.3.1 Info and Relationships: Semantic HTML used ✅
- [ ] 1.3.2 Meaningful Sequence: Reading order logical ✅
- [ ] 1.3.3 Sensory Characteristics: Not color-only ✅
- [ ] 1.3.4 Orientation: Works in all orientations ✅
- [ ] 1.3.5 Identify Input Purpose: autocomplete attributes ✅

**1.4 Distinguishable:**
- [ ] 1.4.1 Use of Color: Not color-only ✅
- [ ] 1.4.2 Audio Control: N/A
- [ ] 1.4.3 Contrast (Minimum): ≥ 4.5:1 ✅
- [ ] 1.4.4 Resize Text: Works at 200% ✅
- [ ] 1.4.5 Images of Text: Avoided ✅
- [ ] 1.4.10 Reflow: No horizontal scroll ✅
- [ ] 1.4.11 Non-text Contrast: ≥ 3:1 ✅
- [ ] 1.4.12 Text Spacing: Adjustable ✅
- [ ] 1.4.13 Content on Hover: Dismissible ✅

### Principle 2: Operable

**2.1 Keyboard Accessible:**
- [ ] 2.1.1 Keyboard: All functionality keyboard accessible ✅
- [ ] 2.1.2 No Keyboard Trap: Can escape all elements ✅
- [ ] 2.1.4 Character Key Shortcuts: Remappable N/A

**2.2 Enough Time:**
- [ ] 2.2.1 Timing Adjustable: No time limits ✅
- [ ] 2.2.2 Pause, Stop, Hide: No auto-updating content ✅

**2.3 Seizures:**
- [ ] 2.3.1 Three Flashes: No flashing content ✅

**2.4 Navigable:**
- [ ] 2.4.1 Bypass Blocks: Skip links present ✅
- [ ] 2.4.2 Page Titled: Descriptive titles ✅
- [ ] 2.4.3 Focus Order: Logical tab order ✅
- [ ] 2.4.4 Link Purpose: Clear link text ✅
- [ ] 2.4.5 Multiple Ways: Navigation + search ✅
- [ ] 2.4.6 Headings and Labels: Descriptive ✅
- [ ] 2.4.7 Focus Visible: Focus indicators ✅

**2.5 Input Modalities:**
- [ ] 2.5.1 Pointer Gestures: No complex gestures ✅
- [ ] 2.5.2 Pointer Cancellation: Click on up ✅
- [ ] 2.5.3 Label in Name: Visible label matches accessible name ✅
- [ ] 2.5.4 Motion Actuation: No motion-based actions ✅

### Principle 3: Understandable

**3.1 Readable:**
- [ ] 3.1.1 Language of Page: `lang` attribute ✅
- [ ] 3.1.2 Language of Parts: Parts marked if different ✅

**3.2 Predictable:**
- [ ] 3.2.1 On Focus: Focus doesn't trigger changes ✅
- [ ] 3.2.2 On Input: Input doesn't auto-submit ✅
- [ ] 3.2.3 Consistent Navigation: Navigation consistent ✅
- [ ] 3.2.4 Consistent Identification: Icons consistent ✅

**3.3 Input Assistance:**
- [ ] 3.3.1 Error Identification: Errors clearly marked ✅
- [ ] 3.3.2 Labels or Instructions: Forms have labels ✅
- [ ] 3.3.3 Error Suggestion: Helpful error messages ✅
- [ ] 3.3.4 Error Prevention: Confirmations for critical actions ✅

### Principle 4: Robust

**4.1 Compatible:**
- [ ] 4.1.1 Parsing: Valid HTML ✅
- [ ] 4.1.2 Name, Role, Value: All controls have accessible name ✅
- [ ] 4.1.3 Status Messages: Dynamic updates announced ✅

---

## Sign-Off Checklist

### Technical Compliance

- [ ] All axe tests passing (0 violations)
- [ ] Lighthouse accessibility score: 100
- [ ] WAVE scan: 0 errors
- [ ] All WCAG 2.1 AA criteria met
- [ ] Manual testing completed

### Functional Testing

- [ ] Keyboard navigation works throughout
- [ ] Screen reader testing completed (NVDA + VoiceOver)
- [ ] Focus management verified
- [ ] Color contrast verified (all elements ≥ 4.5:1)
- [ ] Mobile accessibility tested

### Documentation

- [ ] All issues documented in audit report
- [ ] Remediation plan created
- [ ] Issues assigned to developers
- [ ] Timeline established

### Sign-Off

```markdown
**Audit Date:** 2025-11-18
**Auditor:** [Name]
**Result:** ✅ PASSED / ⚠️ PASSED WITH ISSUES / ❌ FAILED

**Summary:**
- Total Issues: [count]
- Critical: [count] (must fix before release)
- Major: [count] (fix within 1 week)
- Minor: [count] (fix within 2 weeks)

**Recommendation:**
✅ Approved for release
⚠️ Approved with remediation plan
❌ Not approved - fix critical issues first

**Sign-off:**
- Auditor: ________________ Date: ________
- Engineering Lead: ________ Date: ________
- Product Manager: ________ Date: ________
```

---

## Post-Audit Actions

1. **Create remediation tickets** for all issues
2. **Assign priorities** based on severity
3. **Schedule fixes** according to timeline
4. **Re-test** after fixes applied
5. **Update documentation** with final results
6. **Schedule next audit** (quarterly)

---

**Audit Complete!** 🎉

See [GUIDE_ACCESSIBILITY_TESTING.md](GUIDE_ACCESSIBILITY_TESTING.md) for ongoing testing practices.
