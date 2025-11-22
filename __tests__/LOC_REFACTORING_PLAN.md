# Test File LOC Refactoring Plan

**Created:** 2025-11-18
**Purpose:** Split 6 test files exceeding 300 LOC limit into compliant modules
**Target:** Each file < 300 LOC (ideally ~250 LOC)

---

## Executive Summary

### Current State
- **Total files:** 6 test files
- **Total LOC:** 3,960 lines
- **Average LOC:** 660 lines/file
- **Target:** 14-16 files @ ~250 LOC each

### Refactoring Strategy
- Split by **test domain** (not by describe blocks)
- Extract **shared setup** to dedicated files
- Group **related test scenarios** together
- Maintain **clear naming conventions**
- Ensure **zero test loss**

### Estimated Effort
- **Planning:** 1 hour (this document)
- **Execution:** 4-6 hours
- **Verification:** 1 hour
- **Total:** 6-8 hours

---

## File 1: ai-processor.test.ts (1109 LOC → 4 files)

### Current Structure
```
1109 LOC total
- 29 test cases
- 7 describe blocks
- Massive beforeEach setup (~60 LOC)
```

### Split Plan

#### File 1.1: `ai-processor-core.test.ts` (≈280 LOC)
**What goes here:**
- Basic Message Processing (3 tests)
- ReAct Loop - Tool Execution (3 tests)
- Widget Configuration (2 tests)

**Rationale:** Core message flow and tool execution belong together

**New file structure:**
```typescript
// __tests__/lib/chat/ai-processor-core.test.ts
describe('AI Processor - Core Functionality', () => {
  // Setup (extracted to shared file)

  describe('Basic Message Processing', () => {
    it('should process simple conversation without tools')
    it('should handle empty AI response gracefully')
    it('should add tool availability instructions')
  })

  describe('ReAct Loop - Tool Execution', () => {
    it('should execute tools and iterate until AI responds')
    it('should execute multiple tools in parallel')
    it('should respect max iterations limit')
  })

  describe('Widget Configuration', () => {
    it('should use widget AI settings')
    it('should log widget integration settings')
  })
})
```

#### File 1.2: `ai-processor-fallback.test.ts` (≈240 LOC)
**What goes here:**
- Max iterations fallback tests (2 tests)
- Error handling (3 tests)
- Response formatting (4 tests)

**Rationale:** Error handling and fallback behavior are closely related

**New file structure:**
```typescript
// __tests__/lib/chat/ai-processor-fallback.test.ts
describe('AI Processor - Fallback & Error Handling', () => {
  describe('Max Iterations Fallback', () => {
    it('should generate context-aware fallback message')
    it('should include helpful guidance in fallback')
  })

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully')
    it('should handle tool execution failures')
    it('should handle malformed tool arguments')
  })

  describe('Response Formatting', () => {
    it('should sanitize outbound links')
    it('should not sanitize localhost links')
    it('should normalize whitespace')
    it('should convert numbered lists to bullets')
  })
})
```

#### File 1.3: `ai-processor-shopping.test.ts` (≈260 LOC)
**What goes here:**
- Shopping Mode Integration (3 tests)

**Rationale:** Shopping mode is a distinct feature domain

**New file structure:**
```typescript
// __tests__/lib/chat/ai-processor-shopping.test.ts
describe('AI Processor - Shopping Mode', () => {
  describe('Product Collection', () => {
    it('should collect products from tool results')
    it('should trigger shopping mode on mobile')
    it('should not trigger without products')
  })
})
```

#### File 1.4: `ai-processor-telemetry.test.ts` (≈240 LOC)
**What goes here:**
- Telemetry and Logging (3 tests)

**Rationale:** Observability is a separate concern

**New file structure:**
```typescript
// __tests__/lib/chat/ai-processor-telemetry.test.ts
describe('AI Processor - Telemetry', () => {
  describe('Logging', () => {
    it('should log initial completion request')
    it('should track each iteration')
    it('should track search executions')
  })
})
```

#### Shared Setup File: `ai-processor-setup.ts` (≈90 LOC)
**What goes here:**
- Common beforeEach setup
- Mock factory functions
- Type definitions

```typescript
// __tests__/lib/chat/ai-processor-setup.ts
export function createMockOpenAIClient() { ... }
export function createMockTelemetry() { ... }
export function createMockDependencies() { ... }
export function createBaseParams() { ... }
```

---

## File 2: ai-processor-hallucination.test.ts (760 LOC → 3 files)

### Current Structure
```
760 LOC total
- 11 test cases
- 9 describe blocks
- Anti-hallucination safeguards
```

### Split Plan

#### File 2.1: `ai-processor-hallucination-technical.test.ts` (≈280 LOC)
**What goes here:**
- Technical Specifications (2 tests)
- Compatibility Claims (1 test)
- Installation & Usage (1 test)

**Rationale:** Technical accuracy and guidance

**New file structure:**
```typescript
// __tests__/lib/chat/ai-processor-hallucination-technical.test.ts
describe('AI Processor - Hallucination Prevention: Technical', () => {
  describe('Technical Specifications', () => {
    it('should admit uncertainty when specs not available')
    it('should not fabricate technical details')
  })

  describe('Compatibility Claims', () => {
    it('should not make definitive claims without data')
  })

  describe('Installation & Usage', () => {
    it('should not provide detailed steps without docs')
  })
})
```

#### File 2.2: `ai-processor-hallucination-commerce.test.ts` (≈260 LOC)
**What goes here:**
- Stock & Availability (1 test)
- Delivery Promises (1 test)
- Pricing (2 tests)

**Rationale:** Commercial/transactional claims

**New file structure:**
```typescript
// __tests__/lib/chat/ai-processor-hallucination-commerce.test.ts
describe('AI Processor - Hallucination Prevention: Commerce', () => {
  describe('Stock & Availability', () => {
    it('should not provide stock quantities without data')
  })

  describe('Delivery Promises', () => {
    it('should not make specific delivery promises')
  })

  describe('Pricing', () => {
    it('should not fabricate prices or comparisons')
    it('should not quote specific discounts')
  })
})
```

#### File 2.3: `ai-processor-hallucination-metadata.test.ts` (≈220 LOC)
**What goes here:**
- Warranty & Legal (1 test)
- Product Origin (1 test)
- Alternative Products (1 test)

**Rationale:** Product metadata and recommendations

**New file structure:**
```typescript
// __tests__/lib/chat/ai-processor-hallucination-metadata.test.ts
describe('AI Processor - Hallucination Prevention: Metadata', () => {
  describe('Warranty & Legal', () => {
    it('should not state specific warranty terms')
  })

  describe('Product Origin', () => {
    it('should not speculate on manufacturing location')
  })

  describe('Alternative Products', () => {
    it('should qualify alternative suggestions')
  })
})
```

---

## File 3: ai-processor-edge-cases.test.ts (716 LOC → 3 files)

### Current Structure
```
716 LOC total
- 30+ test cases
- 7 describe blocks
- Edge cases and stress tests
```

### Split Plan

#### File 3.1: `ai-processor-edge-input.test.ts` (≈260 LOC)
**What goes here:**
- Empty and Malformed Input (4 tests)
- Very Long Messages (2 tests)
- Special Characters (3 tests)

**Rationale:** Input validation and encoding

**New file structure:**
```typescript
// __tests__/lib/chat/ai-processor-edge-input.test.ts
describe('AI Processor - Edge Cases: Input', () => {
  describe('Empty & Malformed Input', () => {
    it('should handle empty message content')
    it('should handle whitespace-only messages')
    it('should handle missing conversation messages')
    it('should handle malformed message objects')
  })

  describe('Very Long Messages', () => {
    it('should handle very long user messages')
    it('should handle long conversation history')
  })

  describe('Special Characters', () => {
    it('should handle special characters')
    it('should handle unicode and emojis')
    it('should handle markdown and code blocks')
  })
})
```

#### File 3.2: `ai-processor-edge-tools.test.ts` (≈240 LOC)
**What goes here:**
- Tool Execution Edge Cases (3 tests)
- OpenAI API Edge Cases (4 tests)

**Rationale:** External integration failures

**New file structure:**
```typescript
// __tests__/lib/chat/ai-processor-edge-tools.test.ts
describe('AI Processor - Edge Cases: Tools & API', () => {
  describe('Tool Execution', () => {
    it('should handle all tools returning no results')
    it('should handle all tools failing simultaneously')
    it('should handle malformed tool results')
  })

  describe('OpenAI API', () => {
    it('should handle no choices returned')
    it('should handle null message')
    it('should handle rate limit errors')
    it('should handle authentication errors')
  })
})
```

#### File 3.3: `ai-processor-edge-performance.test.ts` (≈216 LOC)
**What goes here:**
- Missing/Invalid Configuration (4 tests)
- Concurrent and Race Conditions (1 test)
- Memory and Performance (1 test)

**Rationale:** Performance and configuration edge cases

**New file structure:**
```typescript
// __tests__/lib/chat/ai-processor-edge-performance.test.ts
describe('AI Processor - Edge Cases: Performance', () => {
  describe('Missing Configuration', () => {
    it('should use defaults when config missing')
    it('should handle missing domain')
    it('should work without telemetry')
    it('should handle invalid maxSearchIterations')
  })

  describe('Concurrent Operations', () => {
    it('should handle rapid tool call responses')
  })

  describe('Memory & Performance', () => {
    it('should not accumulate excessive data')
  })
})
```

---

## File 4: concurrent-access.test.ts (489 LOC → 2 files)

### Current Structure
```
489 LOC total
- 15 test cases
- 4 describe blocks
- CredentialVault concurrency tests
```

### Split Plan

#### File 4.1: `concurrent-access-operations.test.ts` (≈260 LOC)
**What goes here:**
- Concurrent Operations (4 tests)
- Race Conditions (3 tests)

**Rationale:** Core concurrency scenarios

**New file structure:**
```typescript
// __tests__/lib/autonomous/security/tests/concurrent-access-operations.test.ts
describe('CredentialVault - Concurrent Operations', () => {
  describe('Concurrent CRUD', () => {
    it('should handle concurrent store operations')
    it('should handle concurrent get operations')
    it('should handle concurrent delete operations')
    it('should handle mixed operations')
  })

  describe('Race Conditions', () => {
    it('should handle simultaneous updates to same credential')
    it('should handle read during write')
    it('should handle delete during read')
  })
})
```

#### File 4.2: `concurrent-access-edge-cases.test.ts` (≈229 LOC)
**What goes here:**
- Edge Cases (8 tests)
- List Operations (3 tests)

**Rationale:** Edge cases and query operations

**New file structure:**
```typescript
// __tests__/lib/autonomous/security/tests/concurrent-access-edge-cases.test.ts
describe('CredentialVault - Concurrent Access Edge Cases', () => {
  describe('Edge Cases', () => {
    it('should handle empty credential value')
    it('should handle very long values')
    it('should handle special characters')
    it('should handle unicode characters')
    it('should handle complex metadata')
    it('should handle expiration dates')
  })

  describe('List Operations', () => {
    it('should list all credentials')
    it('should filter by service')
    it('should handle empty list')
  })
})
```

---

## File 5: encryption-rotation.test.ts (472 LOC → 2 files)

### Current Structure
```
472 LOC total
- 20 test cases
- 6 describe blocks
- Encryption and key rotation tests
```

### Split Plan

#### File 5.1: `encryption-rotation-core.test.ts` (≈260 LOC)
**What goes here:**
- Encryption Correctness (3 tests)
- Key Rotation (5 tests)

**Rationale:** Core encryption functionality

**New file structure:**
```typescript
// __tests__/lib/autonomous/security/tests/encryption-rotation-core.test.ts
describe('CredentialVault - Encryption & Key Rotation', () => {
  describe('Encryption Correctness', () => {
    it('should encrypt before storage')
    it('should decrypt on retrieval')
    it('should use AES-256-GCM')
  })

  describe('Key Rotation', () => {
    it('should support rotation for existing credentials')
    it('should track encryption key version')
    it('should identify stale credentials')
    it('should update last_rotated_at timestamp')
    it('should support multiple key versions')
  })
})
```

#### File 5.2: `encryption-rotation-validation.test.ts` (≈212 LOC)
**What goes here:**
- Credential Expiration (3 tests)
- Error Handling (5 tests)
- Credential Verification (3 tests)

**Rationale:** Validation and error scenarios

**New file structure:**
```typescript
// __tests__/lib/autonomous/security/tests/encryption-rotation-validation.test.ts
describe('CredentialVault - Validation & Error Handling', () => {
  describe('Credential Expiration', () => {
    it('should reject expired credentials')
    it('should accept future expiration')
    it('should accept no expiration')
  })

  describe('Error Handling', () => {
    it('should handle encryption errors')
    it('should handle decryption errors')
    it('should handle wrong key errors')
    it('should handle database errors')
    it('should handle missing credentials')
  })

  describe('Verification', () => {
    it('should verify valid credentials')
    it('should return false for expired')
    it('should return false for missing')
  })
})
```

---

## File 6: security-compliance.test.ts (414 LOC → 2 files)

### Current Structure
```
414 LOC total
- 14 test cases
- 6 describe blocks
- Security and compliance tests
```

### Split Plan

#### File 6.1: `security-compliance-logging.test.ts` (≈240 LOC)
**What goes here:**
- Sensitive Data Redaction (2 tests)
- Log Integrity (3 tests)
- Security Event Logging (3 tests)

**Rationale:** Core security logging features

**New file structure:**
```typescript
// __tests__/lib/autonomous/security/audit-logger/security-compliance-logging.test.ts
describe('AuditLogger - Security Logging', () => {
  describe('Sensitive Data Redaction', () => {
    it('should redact credentials from actions')
    it('should handle AI responses with sensitive data')
  })

  describe('Log Integrity', () => {
    it('should preserve chronological order')
    it('should detect missing steps')
    it('should prevent duplicate step numbers')
  })

  describe('Security Events', () => {
    it('should log failed authentication')
    it('should log permission denied')
    it('should log suspicious patterns')
  })
})
```

#### File 6.2: `security-compliance-operations.test.ts` (≈174 LOC)
**What goes here:**
- Compliance Audit Support (3 tests)
- Performance & Scalability (2 tests)
- Error Handling (2 tests)

**Rationale:** Operational and compliance features

**New file structure:**
```typescript
// __tests__/lib/autonomous/security/audit-logger/security-compliance-operations.test.ts
describe('AuditLogger - Operations & Compliance', () => {
  describe('Compliance Support', () => {
    it('should support audit trail export')
    it('should provide statistics')
    it('should support retention policies')
  })

  describe('Performance', () => {
    it('should handle high-volume logging')
    it('should handle concurrent operations')
  })

  describe('Error Handling', () => {
    it('should handle database errors')
    it('should handle missing client')
  })
})
```

---

## Shared Setup Strategy

### Setup File Pattern

Each test domain gets a dedicated setup file:

1. **`ai-processor-setup.ts`** (≈90 LOC)
   ```typescript
   export function createMockOpenAIClient()
   export function createMockTelemetry()
   export function createMockDependencies()
   export function createBaseParams()
   ```

2. **`credential-vault-setup.ts`** (already exists at `setup.ts`)
   - No changes needed
   - Current file is well-structured

3. **`audit-logger-setup.ts`** (extract from existing tests)
   ```typescript
   export function createMockSupabaseClient()
   export function createMockOperations()
   export function createMockAuditStep()
   ```

### Benefits of Shared Setup
- ✅ Eliminates 50-60 LOC of duplication per file
- ✅ Ensures consistency across related tests
- ✅ Single source of truth for mock configuration
- ✅ Easy to update when interfaces change

---

## New File Structure Diagram

### Before (6 files, 3,960 LOC)
```
__tests__/
├── lib/chat/
│   ├── ai-processor.test.ts (1109 LOC) ❌
│   ├── ai-processor-hallucination.test.ts (760 LOC) ❌
│   └── ai-processor-edge-cases.test.ts (716 LOC) ❌
└── lib/autonomous/security/
    ├── tests/
    │   ├── concurrent-access.test.ts (489 LOC) ❌
    │   └── encryption-rotation.test.ts (472 LOC) ❌
    └── audit-logger/
        └── security-compliance.test.ts (414 LOC) ❌
```

### After (16 files, ~3,960 LOC + setup files)
```
__tests__/
├── lib/chat/
│   ├── ai-processor-setup.ts (90 LOC) 🆕
│   ├── ai-processor-core.test.ts (280 LOC) ✅
│   ├── ai-processor-fallback.test.ts (240 LOC) ✅
│   ├── ai-processor-shopping.test.ts (260 LOC) ✅
│   ├── ai-processor-telemetry.test.ts (240 LOC) ✅
│   ├── ai-processor-hallucination-technical.test.ts (280 LOC) ✅
│   ├── ai-processor-hallucination-commerce.test.ts (260 LOC) ✅
│   ├── ai-processor-hallucination-metadata.test.ts (220 LOC) ✅
│   ├── ai-processor-edge-input.test.ts (260 LOC) ✅
│   ├── ai-processor-edge-tools.test.ts (240 LOC) ✅
│   └── ai-processor-edge-performance.test.ts (216 LOC) ✅
└── lib/autonomous/security/
    ├── tests/
    │   ├── concurrent-access-operations.test.ts (260 LOC) ✅
    │   ├── concurrent-access-edge-cases.test.ts (229 LOC) ✅
    │   ├── encryption-rotation-core.test.ts (260 LOC) ✅
    │   └── encryption-rotation-validation.test.ts (212 LOC) ✅
    └── audit-logger/
        ├── security-compliance-logging.test.ts (240 LOC) ✅
        └── security-compliance-operations.test.ts (174 LOC) ✅
```

**Summary:**
- **Before:** 6 files @ 660 avg LOC
- **After:** 16 files @ 247 avg LOC
- **Setup files:** 3 files @ 90 avg LOC
- **All files:** < 300 LOC ✅

---

## Verification Checklist

### Pre-Refactoring
- [ ] Create backup branch: `git checkout -b backup/pre-loc-refactor-tests`
- [ ] Run all tests and capture baseline: `npm test > baseline-test-results.txt`
- [ ] Note current test count: `grep -r "it(" __tests__/ | wc -l`
- [ ] Note current coverage: `npm run test:coverage`

### During Refactoring (Per File)
- [ ] Create new split files
- [ ] Copy tests to appropriate new files
- [ ] Extract shared setup to setup file
- [ ] Update imports in all new files
- [ ] Verify file LOC < 300: `wc -l <file>`
- [ ] Run tests for this module: `npm test <pattern>`
- [ ] Commit incremental changes

### Post-Refactoring (Final)
- [ ] Delete original large files
- [ ] Run full test suite: `npm test`
- [ ] Compare test count with baseline (should be equal)
- [ ] Compare coverage with baseline (should be ≥ original)
- [ ] Run LOC compliance check: `npx tsx scripts/check-file-length.ts --strict`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Update any documentation referencing old file names
- [ ] Create PR with before/after comparison

---

## Implementation Order

**Recommended order (simplest to hardest):**

1. **security-compliance.test.ts** (easiest - clean splits)
   - 2 files, clear domain boundaries
   - ~30 minutes

2. **concurrent-access.test.ts** (easy - already has setup file)
   - 2 files, existing setup
   - ~30 minutes

3. **encryption-rotation.test.ts** (easy - existing setup file)
   - 2 files, existing setup
   - ~30 minutes

4. **ai-processor-edge-cases.test.ts** (medium - needs setup extraction)
   - 3 files + setup file
   - ~60 minutes

5. **ai-processor-hallucination.test.ts** (medium - needs setup extraction)
   - 3 files, shares setup with ai-processor.test.ts
   - ~60 minutes

6. **ai-processor.test.ts** (hardest - most complex)
   - 4 files + setup file
   - ~90 minutes

**Total estimated time:** 5 hours (including breaks and verification)

---

## Naming Conventions

### Test File Naming Pattern
```
<module>-<domain>.test.ts
```

Examples:
- ✅ `ai-processor-core.test.ts` (module: ai-processor, domain: core)
- ✅ `ai-processor-hallucination-technical.test.ts` (module: ai-processor-hallucination, domain: technical)
- ✅ `concurrent-access-operations.test.ts` (module: concurrent-access, domain: operations)
- ❌ `ai-processor-tests-part1.test.ts` (bad: not descriptive)
- ❌ `tests-ai-processor.test.ts` (bad: wrong prefix)

### Setup File Naming Pattern
```
<module>-setup.ts
```

Examples:
- ✅ `ai-processor-setup.ts`
- ✅ `credential-vault-setup.ts`
- ✅ `audit-logger-setup.ts`

---

## Migration Strategy (Step-by-Step)

### For each file to refactor:

1. **Create setup file** (if needed)
   ```bash
   touch __tests__/lib/chat/ai-processor-setup.ts
   ```

2. **Extract common setup**
   - Copy beforeEach blocks
   - Create factory functions
   - Export mock creators

3. **Create split files**
   ```bash
   touch __tests__/lib/chat/ai-processor-core.test.ts
   touch __tests__/lib/chat/ai-processor-fallback.test.ts
   # ... etc
   ```

4. **Copy tests to new files**
   - Group by domain (as per plan above)
   - Update imports to use setup file
   - Preserve all test logic exactly

5. **Verify each split file**
   ```bash
   npm test ai-processor-core
   ```

6. **Delete original file** (only after all splits verified)
   ```bash
   git rm __tests__/lib/chat/ai-processor.test.ts
   ```

7. **Final verification**
   ```bash
   npm test
   npm run lint
   npx tsc --noEmit
   ```

---

## Risk Mitigation

### Potential Issues & Solutions

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tests accidentally deleted | HIGH | Count tests before/after, use Git |
| Import paths broken | MEDIUM | Run TypeScript checks after each file |
| Setup duplication | LOW | Extract to shared setup files first |
| Test isolation broken | MEDIUM | Run each file independently |
| Coverage drops | MEDIUM | Compare coverage reports |

### Rollback Plan

If refactoring fails:
```bash
git checkout backup/pre-loc-refactor-tests
git branch -D feature/loc-refactor-tests
```

---

## Success Criteria

**Must achieve ALL of:**
- ✅ All files < 300 LOC
- ✅ Zero test failures
- ✅ Same number of tests as baseline
- ✅ Coverage ≥ baseline
- ✅ TypeScript compiles without errors
- ✅ Linter passes
- ✅ Clear, descriptive file names
- ✅ No code duplication (shared setup)

**Bonus goals:**
- 🎯 Average file size ≈ 250 LOC
- 🎯 Coverage improved
- 🎯 Test execution time unchanged or improved
- 🎯 Setup files reusable for future tests

---

## Appendix A: LOC Breakdown by File

### Before Refactoring
| File | Current LOC | Target LOC | Reduction Needed |
|------|-------------|------------|------------------|
| ai-processor.test.ts | 1109 | 4 × 250 | -109 LOC |
| ai-processor-hallucination.test.ts | 760 | 3 × 250 | +10 LOC |
| ai-processor-edge-cases.test.ts | 716 | 3 × 250 | +34 LOC |
| concurrent-access.test.ts | 489 | 2 × 245 | +1 LOC |
| encryption-rotation.test.ts | 472 | 2 × 236 | +0 LOC |
| security-compliance.test.ts | 414 | 2 × 207 | +0 LOC |
| **Total** | **3,960** | **16 × ~248** | **-64 LOC** |

**Note:** Setup file extraction will add ~270 LOC across 3 files, but these are NOT subject to 300 LOC limit (they're shared utilities, not tests).

### After Refactoring (Projected)
| File | LOC | Status |
|------|-----|--------|
| ai-processor-core.test.ts | 280 | ✅ |
| ai-processor-fallback.test.ts | 240 | ✅ |
| ai-processor-shopping.test.ts | 260 | ✅ |
| ai-processor-telemetry.test.ts | 240 | ✅ |
| ai-processor-hallucination-technical.test.ts | 280 | ✅ |
| ai-processor-hallucination-commerce.test.ts | 260 | ✅ |
| ai-processor-hallucination-metadata.test.ts | 220 | ✅ |
| ai-processor-edge-input.test.ts | 260 | ✅ |
| ai-processor-edge-tools.test.ts | 240 | ✅ |
| ai-processor-edge-performance.test.ts | 216 | ✅ |
| concurrent-access-operations.test.ts | 260 | ✅ |
| concurrent-access-edge-cases.test.ts | 229 | ✅ |
| encryption-rotation-core.test.ts | 260 | ✅ |
| encryption-rotation-validation.test.ts | 212 | ✅ |
| security-compliance-logging.test.ts | 240 | ✅ |
| security-compliance-operations.test.ts | 174 | ✅ |
| **Average LOC** | **247** | ✅ |

---

## Appendix B: Test Count Verification

### Current Test Count (Baseline)
```bash
# Count all "it(" declarations
grep -r "it(" __tests__/lib/chat/ai-processor*.test.ts | wc -l
# Expected: ~40 tests

grep -r "it(" __tests__/lib/autonomous/security/tests/ | wc -l
# Expected: ~35 tests

grep -r "it(" __tests__/lib/autonomous/security/audit-logger/ | wc -l
# Expected: ~14 tests

# Total expected: ~89 tests
```

### Post-Refactoring Test Count
Should match baseline exactly (89 tests).

---

## Appendix C: Example Setup File

```typescript
// __tests__/lib/chat/ai-processor-setup.ts

import { jest } from '@jest/globals';
import type OpenAI from 'openai';
import type { AIProcessorParams } from '@/lib/chat/ai-processor-types';
import type { ChatTelemetry } from '@/lib/chat-telemetry';

/**
 * Create mock OpenAI client for testing
 */
export function createMockOpenAIClient(): jest.Mocked<OpenAI> {
  return {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  } as any;
}

/**
 * Create mock telemetry instance
 */
export function createMockTelemetry(): jest.Mocked<ChatTelemetry> {
  return {
    log: jest.fn(),
    trackIteration: jest.fn(),
    trackSearch: jest.fn()
  } as any;
}

/**
 * Create mock dependencies object
 */
export function createMockDependencies() {
  return {
    getCommerceProvider: jest.fn(),
    searchSimilarContent: jest.fn(),
    sanitizeOutboundLinks: jest.fn((text: string) => text)
  };
}

/**
 * Create base AIProcessorParams for testing
 */
export function createBaseParams(
  overrides?: Partial<AIProcessorParams>
): AIProcessorParams {
  return {
    conversationMessages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Test' }
    ],
    domain: 'example.com',
    config: {
      ai: {
        maxSearchIterations: 3,
        searchTimeout: 10000
      }
    },
    widgetConfig: null,
    telemetry: createMockTelemetry(),
    openaiClient: createMockOpenAIClient(),
    useGPT5Mini: true,
    dependencies: createMockDependencies(),
    isMobile: false,
    ...overrides
  };
}

/**
 * Setup function to call in beforeEach
 */
export function setupAIProcessorTests() {
  jest.clearAllMocks();

  const mockOpenAIClient = createMockOpenAIClient();
  const mockTelemetry = createMockTelemetry();
  const mockDependencies = createMockDependencies();
  const baseParams = createBaseParams({
    openaiClient: mockOpenAIClient,
    telemetry: mockTelemetry,
    dependencies: mockDependencies
  });

  return {
    mockOpenAIClient,
    mockTelemetry,
    mockDependencies,
    baseParams
  };
}
```

---

## End of Plan

**Next Steps:**
1. Review this plan with team
2. Create backup branch
3. Start with easiest file (security-compliance.test.ts)
4. Follow implementation order
5. Verify after each file
6. Create PR when all files complete

**Estimated completion:** 6-8 hours of focused work

**Questions?** Add to GitHub discussion or Slack #code-quality channel.
