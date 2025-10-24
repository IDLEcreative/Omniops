# Business Intelligence Test Failures - Forensic Investigation Report

**Investigation Date:** 2025-10-24
**Investigator:** Claude (Forensic Software Investigator)
**Test File:** `/Users/jamesguy/Omniops/__tests__/lib/analytics/business-intelligence.test.ts`
**Source File:** `/Users/jamesguy/Omniops/lib/analytics/business-intelligence.ts`
**Total Failures:** 13 out of 15 tests

---

## Executive Summary

This forensic investigation reveals **critical design mismatches** between the test expectations and the actual source code implementation. The majority of failures stem from:

1. **Wrong return types**: Source code returns complex objects but tests expect arrays
2. **Missing implementation**: Source code has stubbed/incomplete implementations
3. **Constructor usage issues**: Tests don't properly instantiate the class with dependencies
4. **Data structure mismatches**: Source returns different property names than tests expect
5. **Logic bugs**: Several calculation errors in the source code

**Critical Finding:** The source code has significant implementation gaps. This is NOT primarily a test issue - the source code is incomplete and contains bugs.

---

## Detailed Failure Analysis

### FAILURE #1: Conversion Rate Calculation Returns 0 Instead of 0.667
**Test:** `should calculate conversion metrics correctly`
**File Location:** Test line 65, Source line 208

#### Root Cause: SOURCE CODE BUG - Incorrect Conversion Detection Logic

**The Problem:**
- Test provides `metadata: { converted: true }` on conversations
- Source code looks for conversion keywords in MESSAGE CONTENT, not metadata
- Line 168-170: `const hasConversion = messages.some(m => this.isConversionMessage(m.content))`
- Test messages contain "product inquiry", "checkout", "show products", "buy now" - but the mock doesn't properly structure the messages array

**Evidence:**
```typescript
// TEST DATA (line 30-34):
const mockConversations = [
  { session_id: 's1', metadata: { converted: true } },  // ← Expects this to be checked
  { session_id: 's2', metadata: {} },
  { session_id: 's3', metadata: { converted: true } }
];

// SOURCE CODE (line 168-170):
const hasConversion = messages.some(m =>
  this.isConversionMessage(m.content)  // ← Actually checks message content, NOT metadata
);
```

**Additional Issue:**
The test mock doesn't properly nest messages inside conversations. The source code expects:
```typescript
sessions.messages  // Nested via Supabase join
```

But the test provides separate `mockConversations` and `mockMessages` arrays without proper nesting.

**Verdict:** SOURCE CODE needs to either:
- Check `conversation.metadata.converted` flag, OR
- Tests need to properly mock the nested structure with correctly flagged messages

---

### FAILURE #2: avgSessionsBeforeConversion Returns 1 Instead of 0 for Empty Data
**Test:** `should handle empty data gracefully`
**File Location:** Test line 119, Source line 204

#### Root Cause: SOURCE CODE BUG - Division By Zero Protection Creates Wrong Default

**The Problem:**
```typescript
// SOURCE CODE (line 204):
avgSessionsBeforeConversion: totalSessions / Math.max(conversions, 1),
```

When `totalSessions = 0` and `conversions = 0`:
- `Math.max(conversions, 1)` = 1
- `0 / 1` = **0** ✓ (correct)

BUT when `totalSessions = 0` and `conversions = 0`, it should return 0, but there's actually a data structure issue.

**Wait - Re-examining the test failure:**
The test expects `avgSessionsBeforeConversion` to be 0, but receives 1.

This means `totalSessions = 1` when it should be 0. Looking at source line 154-156:
```typescript
for (const session of sessions || []) {
  totalSessions++;
```

The issue is that when `sessions` is `null` or `[]`, the loop should not execute. But line 204 still uses `Math.max(conversions, 1)` which causes:
- If conversions = 0, totalSessions = 0: `0 / 1 = 0` ✓
- But if there's an empty session object, totalSessions = 1, conversions = 0: `1 / 1 = 1` ✗

**Verdict:** SOURCE CODE BUG - The division logic should be:
```typescript
avgSessionsBeforeConversion: conversions > 0 ? totalSessions / conversions : 0,
```

---

### FAILURE #3: analyzeContentGaps Returns Object Instead of Array
**Test:** `should identify frequently unanswered queries`
**File Location:** Test line 144, Source line 220-312

#### Root Cause: SOURCE CODE DESIGN - Wrong Return Type

**The Problem:**
```typescript
// TEST EXPECTATION (line 144):
expect(result).toBeInstanceOf(Array);  // Expects array directly

// SOURCE CODE (line 224):
async analyzeContentGaps(...): Promise<ContentGapAnalysis>

// SOURCE CODE RETURN TYPE (line 36-41):
export interface ContentGapAnalysis {
  unansweredQueries: UnansweredQuery[];  // ← Array is NESTED here
  lowConfidenceTopics: string[];
  suggestedContent: ContentSuggestion[];
  coverageScore: number;
}
```

The source returns a **complete analysis object**, but the test expects **just the array** of unanswered queries.

**Evidence:**
- Source line 302-307: Returns full `ContentGapAnalysis` object
- Test line 144-147: Expects direct array with `result[0].query`

**Verdict:** TEST CODE BUG - Test should access `result.unansweredQueries`, not `result` directly:
```typescript
expect(result.unansweredQueries).toBeInstanceOf(Array);
expect(result.unansweredQueries[0].query).toBe('return policy?');
```

---

### FAILURE #4: result.find is not a function
**Test:** `should filter by confidence threshold`
**File Location:** Test line 167

#### Root Cause: TEST CODE BUG - Same as #3

**The Problem:**
Same root cause - `result` is a `ContentGapAnalysis` object, not an array.

**Verdict:** TEST CODE BUG - Should be:
```typescript
const lowConfidenceQuery = result.unansweredQueries.find(gap => gap.query === 'low confidence query');
```

---

### FAILURE #5: Cannot read properties of undefined (reading 'query')
**Test:** `should sort by frequency`
**File Location:** Test line 192

#### Root Cause: TEST CODE BUG - Same as #3

**The Problem:**
`result[0]` is undefined because `result` is an object, not an array.

**Verdict:** TEST CODE BUG - Should be:
```typescript
expect(result.unansweredQueries[0].query).toBe('query B');
expect(result.unansweredQueries[0].frequency).toBe(3);
```

---

### FAILURE #6: avgRequests is undefined, expects avgMessages
**Test:** `should calculate hourly distribution`
**File Location:** Test line 225, Source line 368

#### Root Cause: TEST CODE BUG - Wrong Property Name

**The Problem:**
```typescript
// SOURCE CODE (line 66-71):
export interface HourlyUsage {
  hour: number;
  avgMessages: number;        // ← Source uses "avgMessages"
  avgResponseTime: number;
  errorRate: number;
}

// SOURCE CODE (line 368):
avgMessages: messages.length / days,

// TEST CODE (line 225):
expect(hour9?.avgRequests).toBeGreaterThan(0);  // ← Test expects "avgRequests"
```

**Verdict:** TEST CODE BUG - Property is named `avgMessages`, not `avgRequests`:
```typescript
expect(hour9?.avgMessages).toBeGreaterThan(0);
```

---

### FAILURE #7: busiestDays is undefined
**Test:** `should identify busiest days`
**File Location:** Test line 247

#### Root Cause: SOURCE CODE BUG - Missing Property in Return Type

**The Problem:**
```typescript
// TEST EXPECTATION (line 247-249):
expect(result.busiestDays).toBeInstanceOf(Array);
expect(result.busiestDays[0].date).toBe('2024-01-01');
expect(result.busiestDays[0].totalRequests).toBe(3);

// SOURCE CODE RETURN TYPE (line 57-64):
export interface PeakUsagePattern {
  hourlyDistribution: HourlyUsage[];
  dailyDistribution: DailyUsage[];    // ← Has this
  peakHours: { hour: number; load: number }[];
  quietHours: { hour: number; load: number }[];
  predictedNextPeak: Date;
  resourceRecommendation: string;
  // ❌ NO busiestDays property!
}

// SOURCE CODE (line 404-411):
return {
  hourlyDistribution,
  dailyDistribution,  // Returns this instead of busiestDays
  peakHours,
  quietHours,
  predictedNextPeak,
  resourceRecommendation
};
```

**Verdict:** SOURCE CODE BUG - Either:
1. Add `busiestDays` property to return value, OR
2. Test should use `result.dailyDistribution` and calculate busiest days from it

But looking at the interface `DailyUsage` (line 73-78), it doesn't have a `date` property:
```typescript
export interface DailyUsage {
  dayOfWeek: number;      // 0-6, not a date string!
  avgSessions: number;
  peakHour: number;
  totalMessages: number;
}
```

**This is a SOURCE CODE DESIGN FLAW** - The source code doesn't track busiest days by date, only by day of week.

---

### FAILURE #8: peakHours contains objects, test expects numbers
**Test:** `should identify peak hours`
**File Location:** Test line 271

#### Root Cause: TEST CODE BUG - Wrong Type Expectation

**The Problem:**
```typescript
// SOURCE CODE (line 60-61):
peakHours: { hour: number; load: number }[];  // ← Array of objects

// SOURCE CODE (line 391):
const peakHours = sortedHours.slice(0, 3);  // Returns [{ hour: 14, load: 50 }, ...]

// TEST CODE (line 271-272):
expect(result.peakHours).toContain(14);  // ← Expects array of numbers [14, 15]
```

**Verdict:** TEST CODE BUG - Should check object structure:
```typescript
expect(result.peakHours.map(p => p.hour)).toContain(14);
expect(result.peakHours.map(p => p.hour)).toContain(15);
```

OR source code should return just the hour numbers (but that loses the load information).

---

### FAILURE #9: Conversion Funnel Returns Wrong Stage Names
**Test:** `should track progression through stages`
**File Location:** Test line 316

#### Root Cause: SOURCE CODE BUG - Stubbed Implementation Doesn't Use Real Data

**The Problem:**
```typescript
// SOURCE CODE (line 429-436):
const stages_definition = funnelDefinition || [
  'initial_contact',        // ← Source uses these default stages
  'product_inquiry',
  'price_check',
  'order_lookup',
  'purchase'
];

// SOURCE CODE (line 438-445):
const stages: FunnelStage[] = stages_definition.map(stageName => ({
  name: stageName,
  enteredCount: Math.floor(Math.random() * 1000), // ← RANDOM DATA!
  completedCount: Math.floor(Math.random() * 800),
  conversionRate: Math.random() * 100,
  avgDuration: Math.random() * 300,
  dropOffReasons: ['unclear_response', 'price_concern', 'technical_issue']
}));

// TEST EXPECTATION (line 316-323):
expect(result.stages[0].name).toBe('Visit');  // ← Test expects different stage names
expect(result.stages[0].count).toBe(4);       // ← Test expects real counts
```

**This is a CRITICAL SOURCE CODE ISSUE** - The `analyzeConversionFunnel` method is **completely stubbed with random data**. It doesn't:
- Query the database for actual conversations
- Analyze real message patterns
- Calculate actual stage progressions
- Use the test's mock data at all

**Verdict:** SOURCE CODE BUG - Entire method needs to be implemented. It's currently a placeholder.

---

### FAILURE #10: Conversion Rate is 69.5 Instead of 0.5
**Test:** `should calculate conversion rates between stages`
**File Location:** Test line 359

#### Root Cause: SOURCE CODE BUG - Random Data in Stubbed Implementation

**The Problem:**
```typescript
// SOURCE CODE (line 442):
conversionRate: Math.random() * 100,  // ← Returns random value 0-100

// SOURCE CODE (line 458):
overallConversionRate: stages[stages.length - 1]?.conversionRate || 0,  // ← Uses last stage's random rate

// TEST EXPECTATION (line 359):
expect(result.overallConversionRate).toBeCloseTo(0.5, 2);  // ← Expects 50% (0.5 as decimal)
```

**Additional Issue:** The test expects 0.5 (as a decimal/percentage), but the source code uses values 0-100. There's a unit mismatch:
- Test expects: 0.5 (50%)
- Source returns: 50.0 (50%)

**Verdict:** SOURCE CODE BUG - Implementation is stubbed and uses wrong units. Should be implemented properly.

---

### FAILURE #11: Error Handling Doesn't Return Empty Arrays
**Test:** `should handle database errors gracefully`
**File Location:** Test line 379

#### Root Cause: SOURCE CODE BUG - Error Path Still Processes Empty Data

**The Problem:**
```typescript
// TEST MOCK (line 367-370):
select: jest.fn().mockResolvedValue({
  data: null,        // ← Simulates database error
  error: new Error('Database error')
})

// SOURCE CODE (line 144):
if (error) throw error;  // ← Throws error, doesn't continue

// But actually...
// SOURCE CODE (line 154):
for (const session of sessions || []) {  // ← sessions is null, so iterates []
```

Wait, let me re-check. The source throws on error (line 144), but the test expects it to handle gracefully:

```typescript
// TEST (line 378-379):
expect(result.conversionRate).toBe(0);
expect(result.commonPaths).toEqual([]);
```

The test expects NO throw, but source code DOES throw.

**Checking the actual error message:**
```
+ Array [
+   Object {
+     "conversionRate": 100,
+     "frequency": 1,
+     "path": Array [ "" ],
+   },
+ ]
```

This shows the method DID return, but returned wrong data. Let me trace this...

Looking at line 154: `for (const session of sessions || [])` - if sessions is null, it becomes [], so loop doesn't run. Then:
- totalSessions = 0
- conversions = 0
- totalMessages = 0
- journeyPaths is empty Map
- dropOffs is empty Map

Line 185-192: `Array.from(journeyPaths.entries())` would return [] if empty...

But the error shows it returned an array with one item with path `[""]`. This suggests there's ONE session with empty messages being processed somehow.

**Re-examining the mock structure** (line 108-111):
```typescript
mockSupabase.from = jest.fn().mockReturnValue({
  ...mockSupabase,
  select: jest.fn().mockResolvedValue({ data: [], error: null })
})
```

Ah! The error handling test mocks it differently (line 365-371), but I think the issue is that when `data: null, error: Error`, the code throws (line 144).

But the test failure shows it DID return data, so the error isn't being thrown. Let me check if there's a try-catch...

Line 211-214:
```typescript
} catch (error) {
  logger.error('Failed to analyze customer journey', error);
  throw error;  // ← Re-throws!
}
```

So it should throw, but the test expects it to return gracefully. However, the test failure shows it returned data, not threw an error.

**Ah! I see the issue now** - The test expects the SOURCE CODE to handle errors gracefully by returning safe defaults, but the SOURCE CODE throws errors instead. The test failure shows it's returning unexpected data, which means:

1. Either the mock isn't working correctly, OR
2. The source code has a path that returns data even with errors

Looking more carefully, there's no else after line 144's throw, so if there's no error, it continues. The returned data `{ path: [""] }` suggests it's processing an empty sessions array and creating one entry from nothing.

Line 163: `const path = messages.filter(...).map(...).join(' → ')` - if messages is empty, this becomes `""`.

If somehow one session exists with no messages:
- path = "" (empty string)
- journeyPaths.set("", 1)
- This becomes `[{ path: [""], frequency: 1, conversionRate: 100 }]`

The `conversionRate: 100` comes from line 189: `(freq / totalSessions) * 100` = `(1 / 1) * 100 = 100`.

**Verdict:** SOURCE CODE BUG - When database returns error, it throws instead of handling gracefully. The source should:
```typescript
if (error) {
  logger.error('Failed to analyze customer journey', error);
  return {
    conversionRate: 0,
    avgSessionsBeforeConversion: 0,
    avgMessagesPerSession: 0,
    commonPaths: [],
    dropOffPoints: [],
    timeToConversion: 0
  };
}
```

---

### FAILURE #12: Invalid Date Ranges Not Handled
**Test:** `should handle invalid date ranges`
**File Location:** Test line 389

#### Root Cause: SOURCE CODE BUG - No Validation for Invalid Date Ranges

**The Problem:**
The source code doesn't validate that `start < end`. It just queries the database with whatever dates are provided:

```typescript
// SOURCE CODE (line 141-142):
.gte('created_at', timeRange.start.toISOString())
.lte('created_at', timeRange.end.toISOString())
```

If start > end, the query returns no results, which is treated as valid empty data.

**Verdict:** SOURCE CODE BUG - Should validate dates:
```typescript
if (timeRange.start >= timeRange.end) {
  return {
    conversionRate: 0,
    avgSessionsBeforeConversion: 0,
    avgMessagesPerSession: 0,
    commonPaths: [],
    dropOffPoints: [],
    timeToConversion: 0
  };
}
```

---

### FAILURE #13: Domain Filtering Not Implemented
**Test:** `should filter by specific domain`
**File Location:** Test line 402

#### Root Cause: SOURCE CODE BUG - Domain Parameter Not Used

**The Problem:**
```typescript
// SOURCE CODE METHOD SIGNATURE (line 116-119):
async analyzeCustomerJourney(
  domain: string,
  timeRange: TimeRange
): Promise<CustomerJourneyMetrics>

// SOURCE CODE QUERY (line 128-142):
const { data: sessions, error } = await supabase
  .from('conversations')
  .select(...)
  .gte('created_at', timeRange.start.toISOString())
  .lte('created_at', timeRange.end.toISOString());
  // ❌ NO .eq('domain', domain) filter!
```

The `domain` parameter is accepted but never used in the query.

**Verdict:** SOURCE CODE BUG - Should add domain filtering:
```typescript
let query = supabase
  .from('conversations')
  .select(...)
  .gte('created_at', timeRange.start.toISOString())
  .lte('created_at', timeRange.end.toISOString());

if (domain !== 'all') {
  query = query.eq('domain', domain);
}

const { data: sessions, error } = await query;
```

Same issue exists in other methods: `analyzeContentGaps`, `analyzePeakUsage`, `analyzeConversionFunnel`.

---

## Summary Table

| # | Test | Root Cause | Issue Type | Priority |
|---|------|------------|------------|----------|
| 1 | Conversion rate 0 vs 0.667 | Conversion detection logic mismatch + mock structure | SOURCE BUG | HIGH |
| 2 | avgSessions 1 vs 0 | Division by zero protection wrong | SOURCE BUG | MEDIUM |
| 3 | Array vs Object type | Wrong return type expectation | TEST BUG | LOW |
| 4 | result.find not function | Same as #3 | TEST BUG | LOW |
| 5 | Cannot read 'query' | Same as #3 | TEST BUG | LOW |
| 6 | avgRequests vs avgMessages | Wrong property name | TEST BUG | LOW |
| 7 | busiestDays undefined | Missing property in return type | SOURCE BUG | MEDIUM |
| 8 | peakHours type mismatch | Wrong type expectation | TEST BUG | LOW |
| 9 | Wrong stage names | Stubbed implementation with random data | SOURCE BUG | CRITICAL |
| 10 | Wrong conversion rate | Stubbed implementation + unit mismatch | SOURCE BUG | CRITICAL |
| 11 | Error handling | Throws instead of graceful return | SOURCE BUG | HIGH |
| 12 | Invalid date ranges | No validation | SOURCE BUG | MEDIUM |
| 13 | Domain filtering | Parameter not used in query | SOURCE BUG | HIGH |

---

## Priority Fixes

### CRITICAL (Must Fix First)
1. **Implement `analyzeConversionFunnel` properly** - Currently completely stubbed with random data
2. **Fix constructor pattern** - Tests instantiate with `new BusinessIntelligence(mockSupabase)` but class uses singleton pattern and doesn't accept supabase parameter

### HIGH (Fix Next)
3. **Add domain filtering** - All methods ignore the domain parameter
4. **Fix conversion detection** - Should check metadata OR message content consistently
5. **Add graceful error handling** - Return safe defaults instead of throwing

### MEDIUM (Important But Less Urgent)
6. **Fix empty data handling** - avgSessionsBeforeConversion calculation
7. **Add busiestDays tracking** - Or clarify what dailyDistribution provides
8. **Add date validation** - Reject invalid date ranges
9. **Fix mock structure** - Tests need to properly nest messages in conversations

### LOW (Test Adjustments)
10. **Update test expectations** - Fix `analyzeContentGaps` tests to access `.unansweredQueries`
11. **Fix property names** - Change `avgRequests` to `avgMessages`
12. **Fix type expectations** - `peakHours` is array of objects, not numbers

---

## Recommended Fix Order

### Step 1: Fix Constructor/Dependency Injection
The biggest architectural issue is that tests try to inject a mock Supabase client, but the source code uses a singleton pattern and calls `createServiceRoleClient()` internally.

**Current Source Pattern:**
```typescript
export class BusinessIntelligence {
  private static instance: BusinessIntelligence;

  static getInstance(): BusinessIntelligence { ... }

  async analyzeCustomerJourney(...) {
    const supabase = await createServiceRoleClient(); // ← Can't be mocked!
  }
}
```

**Fix: Add Constructor Injection**
```typescript
export class BusinessIntelligence {
  constructor(private supabase?: SupabaseClient) {}

  async analyzeCustomerJourney(...) {
    const supabase = this.supabase || await createServiceRoleClient();
  }
}
```

### Step 2: Fix Core Logic Issues
- Add domain filtering to all methods
- Implement conversion detection properly
- Add error handling with safe defaults
- Add date validation

### Step 3: Fix Data Structure Issues
- Decide on busiestDays vs dailyDistribution
- Fix avgSessionsBeforeConversion calculation
- Ensure consistent percentage units (0-1 vs 0-100)

### Step 4: Implement Stubbed Methods
- Complete `analyzeConversionFunnel` with real logic
- Remove all `Math.random()` placeholders

### Step 5: Update Tests
- Fix `analyzeContentGaps` tests to access correct properties
- Fix property name expectations
- Fix type expectations for complex objects

---

## Code Examples

### Fix #1: Constructor Injection
```typescript
// business-intelligence.ts
export class BusinessIntelligence {
  constructor(private supabase?: SupabaseClient) {}

  async analyzeCustomerJourney(domain: string, timeRange: TimeRange) {
    const supabase = this.supabase || await createServiceRoleClient();
    // ... rest of method
  }
}
```

### Fix #2: Domain Filtering
```typescript
async analyzeCustomerJourney(domain: string, timeRange: TimeRange) {
  // ...
  let query = supabase
    .from('conversations')
    .select(...)
    .gte('created_at', timeRange.start.toISOString())
    .lte('created_at', timeRange.end.toISOString());

  if (domain !== 'all') {
    query = query.eq('domain', domain);
  }

  const { data: sessions, error } = await query;
  // ...
}
```

### Fix #3: Error Handling
```typescript
if (error) {
  logger.error('Failed to analyze customer journey', error);
  return {
    conversionRate: 0,
    avgSessionsBeforeConversion: 0,
    avgMessagesPerSession: 0,
    commonPaths: [],
    dropOffPoints: [],
    timeToConversion: 0
  };
}
```

### Fix #4: Date Validation
```typescript
async analyzeCustomerJourney(domain: string, timeRange: TimeRange) {
  if (timeRange.start >= timeRange.end) {
    logger.warn('Invalid date range provided', { domain, timeRange });
    return {
      conversionRate: 0,
      avgSessionsBeforeConversion: 0,
      avgMessagesPerSession: 0,
      commonPaths: [],
      dropOffPoints: [],
      timeToConversion: 0
    };
  }
  // ...
}
```

### Fix #5: Conversion Detection
```typescript
// Check BOTH metadata and message content
const hasConversion =
  conversation.metadata?.converted === true ||
  messages.some(m => this.isConversionMessage(m.content));
```

### Fix #6: avgSessionsBeforeConversion
```typescript
return {
  avgSessionsBeforeConversion: conversions > 0 ? totalSessions / conversions : 0,
  // ...
}
```

### Fix #7: Test Update for analyzeContentGaps
```typescript
// Before:
expect(result).toBeInstanceOf(Array);
expect(result[0].query).toBe('return policy?');

// After:
expect(result.unansweredQueries).toBeInstanceOf(Array);
expect(result.unansweredQueries[0].query).toBe('return policy?');
```

### Fix #8: Test Update for avgMessages
```typescript
// Before:
expect(hour9?.avgRequests).toBeGreaterThan(0);

// After:
expect(hour9?.avgMessages).toBeGreaterThan(0);
```

### Fix #9: Test Update for peakHours
```typescript
// Before:
expect(result.peakHours).toContain(14);

// After:
expect(result.peakHours.map(p => p.hour)).toContain(14);
```

---

## Conclusion

This investigation reveals that **the majority of failures are SOURCE CODE BUGS**, not test issues. The source code has:

1. **One completely unimplemented method** (analyzeConversionFunnel)
2. **Missing domain filtering** across all methods
3. **Poor error handling** (throws instead of graceful degradation)
4. **Logic bugs** in calculations
5. **No input validation**
6. **Constructor pattern incompatible with testing**

The tests have some issues too:
- Wrong property names in a few places
- Wrong type expectations for complex objects
- Need to access nested properties correctly

**Recommended Approach:**
1. Start with constructor injection fix (enables proper testing)
2. Fix all SOURCE CODE bugs (domain filtering, error handling, validation)
3. Implement the stubbed analyzeConversionFunnel method
4. Update tests for minor property name/structure issues

**Estimated Effort:**
- Source code fixes: 4-6 hours
- Implement analyzeConversionFunnel: 2-3 hours
- Test updates: 1 hour
- **Total: ~8 hours of development work**

The good news is that the test suite is well-designed and caught all these issues. The tests are doing their job - the source code just needs to be completed properly.
